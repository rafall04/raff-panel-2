"use server";

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
};

async function postAuthRequest(
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<AuthResponse> {
  if (!process.env.API_URL) {
    console.error("FATAL: API_URL environment variable is not set.");
    return {
      status: 500,
      user: null,
      token: undefined,
      message: "Server configuration error: API_URL is not set.",
    };
  }

  try {
    const req = await fetch(`${process.env.API_URL}${endpoint}`, {
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
      };
    }

    // The raw error message is not shown: it would leak internals (a bad
    // API_URL echoes the internal host) and means nothing to a customer.
    return {
      status: 500,
      user: null,
      token: undefined,
      message: "Terjadi kendala pada server. Silakan coba lagi.",
    };
  }
}

export const requestOtp = async (phoneNumber: string) => {
  if (!process.env.API_URL) {
    console.error("FATAL: API_URL environment variable is not set.");
    return {
      ok: false,
      message: "Server configuration error: API_URL is not set.",
    };
  }
  try {
    const req = await fetch(`${process.env.API_URL}/api/auth/otp/request`, {
      method: "POST",
      body: JSON.stringify({
        phoneNumber,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
    });

    const data = await req.json();
    return {
      ok: req.ok,
      message: data.message,
    };
  } catch (error) {
    return {
      ok: false,
      message: isTimeout(error)
        ? "Server sedang lambat merespons. Silakan coba lagi."
        : "Terjadi kendala saat mengirim kode OTP. Silakan coba lagi.",
    };
  }
};

export const verify = async (phoneNumber: string, otp: string) => {
  return postAuthRequest("/api/auth/otp/verify", { phoneNumber, otp });
};

export const verifyPassword = async (username: string, password: string) => {
  return postAuthRequest("/api/auth/login", { username, password });
};

export const updateCredentials = async (
  currentPassword: string,
  newUsername?: string,
  newPassword?: string,
) => {
  const { getBackendAccessToken } = await import("@/lib/auth");
  const token = await getBackendAccessToken();

  if (!token) {
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

  const req = await fetch(
    `${process.env.API_URL}/api/customer/account/update`,
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const json = await req.json();

  return {
    status: req.status,
    message: json.message,
  };
};
