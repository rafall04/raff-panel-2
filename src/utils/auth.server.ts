"use server";

import { SITE_IDS, getSiteApiUrl, type SiteId } from "@/lib/sites";

/**
 * Login and OTP are the first thing a customer touches, so they must fail fast
 * and say so rather than hang. raf-bot-v2 can stall behind WhatsApp delivery or
 * an open circuit breaker, and an unbounded fetch would leave the customer
 * watching a spinner until undici's ~5 minute default.
 */
const AUTH_TIMEOUT_MS = 15000;

function isTimeout(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

type AuthResponse = {
  status: number;
  user: Record<string, unknown> | null;
  token: string | undefined;
  message: string | null;
  /** Which site answered — set once fan-out settles on a backend. */
  site?: SiteId;
};

/**
 * POST an auth request to one specific site's backend.
 *
 * Customers never pick a location; the panel discovers it by trying each site
 * (see {@link fanOutAuth}). This is the single-site leg of that fan-out, so it
 * tags every response with the site it came from.
 */
async function postAuthToSite(
  site: SiteId,
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<AuthResponse> {
  let baseUrl: string;
  try {
    baseUrl = getSiteApiUrl(site);
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Site URL not configured",
    );
    return {
      status: 500,
      user: null,
      token: undefined,
      message: "Server configuration error: backend URL is not set.",
      site,
    };
  }

  try {
    const req = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
    });

    const json = await req.json().catch(() => ({}));
    const responseData = json.data || json;

    return {
      status: json.status || req.status,
      user: responseData.user || json.user || null,
      token: responseData.token || json.token || undefined,
      message: json.message || null,
      site,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[AUTH] Request failed:",
        error instanceof Error ? error.message : String(error),
      );
    }

    if (isTimeout(error)) {
      return {
        status: 504,
        user: null,
        token: undefined,
        message: "Server sedang lambat merespons. Silakan coba lagi.",
        site,
      };
    }

    // The raw error message is not shown: it would leak internals (a bad URL
    // echoes the internal host) and means nothing to a customer.
    return {
      status: 500,
      user: null,
      token: undefined,
      message: "Terjadi kendala pada server. Silakan coba lagi.",
      site,
    };
  }
}

/**
 * Discover which site a customer belongs to by trying each backend in turn.
 *
 * The panel holds no customer directory — the per-site raf-bot-v2 backends are
 * the only source of truth — so "which site is this?" is answered by asking
 * them. The first backend that accepts the request wins, and its site is what
 * gets pinned to the session.
 *
 * `notMineStatus` is the HTTP status a backend returns when the identity is not
 * one of its customers, so fan-out should move on to the next site:
 *   - OTP request/verify → 404 (a precise "not my customer")
 *   - password login     → 401 ("wrong username or password" is indistinguishable
 *                           from "not found", so every site is tried)
 *
 * A backend that is merely unreachable (5xx / timeout) is inconclusive: we skip
 * it but remember it, so a customer at site B still logs in while site A is down,
 * and a total outage surfaces "try again" rather than a misleading "not found".
 * Any other 4xx (wrong OTP, expired, rate-limited) is the owning site's final
 * word and is returned as-is.
 */
async function fanOutAuth(
  endpoint: string,
  payload: Record<string, unknown>,
  notMineStatus: number,
): Promise<AuthResponse> {
  let unreachable: AuthResponse | null = null;
  let notMine: AuthResponse | null = null;

  for (const site of SITE_IDS) {
    const result = await postAuthToSite(site, endpoint, payload);

    if (result.status >= 200 && result.status < 300) {
      return result; // this site owns the customer
    }
    if (result.status === notMineStatus) {
      notMine = result;
      continue;
    }
    if (result.status >= 500) {
      unreachable = result;
      continue;
    }
    return result; // a definitive rejection from the owning site
  }

  // No site accepted. Prefer surfacing an outage over a misleading "not found".
  return (
    unreachable ??
    notMine ?? {
      status: notMineStatus,
      user: null,
      token: undefined,
      message: null,
      site: undefined,
    }
  );
}

export const requestOtp = async (phoneNumber: string) => {
  const result = await fanOutAuth(
    "/api/auth/otp/request",
    { phoneNumber },
    404,
  );

  if (result.status >= 200 && result.status < 300) {
    return { ok: true, message: result.message ?? "Kode OTP sudah dikirim." };
  }

  if (result.status === 404) {
    return {
      ok: false,
      message:
        "Nomor WhatsApp tidak terdaftar. Pastikan nomor sesuai data pelanggan Anda.",
    };
  }

  return {
    ok: false,
    message:
      result.message ??
      "Terjadi kendala saat mengirim kode OTP. Silakan coba lagi.",
  };
};

export const verify = async (phoneNumber: string, otp: string) => {
  return fanOutAuth("/api/auth/otp/verify", { phoneNumber, otp }, 404);
};

export const verifyPassword = async (username: string, password: string) => {
  return fanOutAuth("/api/auth/login", { username, password }, 401);
};

export const updateCredentials = async (
  currentPassword: string,
  newUsername?: string,
  newPassword?: string,
) => {
  const { getBackendContext } = await import("@/lib/auth");
  const ctx = await getBackendContext();

  if (!ctx) {
    return {
      status: 401,
      message: "Not authenticated",
    };
  }

  const body: {
    currentPassword: string;
    newUsername?: string;
    newPassword?: string;
  } = { currentPassword };
  if (newUsername) {
    body.newUsername = newUsername;
  }
  if (newPassword) {
    body.newPassword = newPassword;
  }

  const req = await fetch(`${ctx.baseUrl}/api/customer/account/update`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ctx.token}`,
    },
  });

  const json = await req.json();

  return {
    status: req.status,
    message: json.message,
  };
};
