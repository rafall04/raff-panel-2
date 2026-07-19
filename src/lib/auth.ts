import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { cookies } from "next/headers";
import { verify, verifyPassword } from "@/utils/auth.server";
import {
  DEFAULT_SITE,
  getSiteApiUrl,
  isSiteId,
  type SiteId,
} from "@/lib/sites";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("FATAL: NEXTAUTH_SECRET environment variable is not set.");
}

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV === "development",
  providers: [
    CredentialsProvider({
      id: "otp",
      name: "OTP",
      type: "credentials",
      credentials: {
        phoneNumber: { label: "Phone Number", type: "text" },
        otp: { label: "OTP Code", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.phoneNumber || !credentials.otp) {
            if (process.env.NODE_ENV === "development") {
              console.error("[AUTH] Missing credentials");
            }
            throw new Error("Phone number and OTP are required.");
          }

          // No site is passed from the client: the panel discovers it by
          // fanning out across backends and pins whichever one owns this number.
          const r = await verify(credentials.phoneNumber, credentials.otp);

          if (r.status !== 200) {
            const errorMessage =
              r.message || `Backend returned status ${r.status}.`;
            if (process.env.NODE_ENV === "development") {
              console.error("[AUTH] Verification failed:", errorMessage);
            }
            throw new Error(errorMessage);
          }

          if (!r.token) {
            if (process.env.NODE_ENV === "development") {
              console.error("[AUTH] Token not received");
            }
            throw new Error(
              "Authentication failed: Token not received from backend.",
            );
          }

          if (!r.user) {
            if (process.env.NODE_ENV === "development") {
              console.error("[AUTH] User data not received");
            }
            throw new Error(
              "Authentication failed: User data not received from backend.",
            );
          }

          if (!isSiteId(r.site)) {
            throw new Error(
              "Authentication failed: site could not be determined.",
            );
          }

          return {
            id: credentials.phoneNumber,
            name: typeof r.user.name === "string" ? r.user.name : null,
            phoneNumber:
              typeof r.user.phoneNumber === "string"
                ? r.user.phoneNumber
                : typeof r.user.phone_number === "string"
                  ? r.user.phone_number
                  : credentials.phoneNumber,
            backendToken: r.token,
            userData: r.user,
            site: r.site,
          };
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error(
              "[AUTH] Error:",
              error instanceof Error ? error.message : String(error),
            );
          }
          throw error;
        }
      },
    }),
    CredentialsProvider({
      id: "username-password",
      name: "Username & Password",
      credentials: {
        username: {},
        password: {},
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) {
          throw new Error("Username and password are required.");
        }
        // No site is passed from the client: fan-out finds the backend that
        // accepts these credentials and that site is pinned to the session.
        const r = await verifyPassword(
          credentials.username,
          credentials.password,
        );

        if (r.status !== 200) {
          throw new Error(
            r.message || `Authentication failed. Status: ${r.status}`,
          );
        }
        if (!r.token) {
          throw new Error(
            "Authentication failed: Token not received from backend.",
          );
        }
        if (!r.user) {
          throw new Error(
            "Authentication failed: User data not received from backend.",
          );
        }
        if (!isSiteId(r.site)) {
          throw new Error(
            "Authentication failed: site could not be determined.",
          );
        }
        const userIdentifier =
          r.user.phoneNumber ||
          r.user.phone_number ||
          r.user.username ||
          credentials.username;

        return {
          id: String(userIdentifier),
          name: typeof r.user.name === "string" ? r.user.name : null,
          phoneNumber:
            typeof r.user.phoneNumber === "string"
              ? r.user.phoneNumber
              : typeof r.user.phone_number === "string"
                ? r.user.phone_number
                : String(userIdentifier),
          backendToken: r.token,
          userData: r.user,
          site: r.site,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "",
  callbacks: {
    async jwt({ token, user }) {
      // Only log in debug mode to reduce noise
      if (process.env.NODE_ENV === "development") {
        console.error("[NEXTAUTH CALLBACK] jwt() called:", {
          hasUser: !!user,
          hasToken: !!token,
          tokenKeys: Object.keys(token),
        });
      }

      // Runtime check: user is undefined on subsequent jwt() calls (only present on initial sign-in)
      // TypeScript type definition doesn't accurately reflect this NextAuth runtime behavior
      // Using type assertion to handle the false positive from ESLint
      const userData = user as typeof user | undefined;
      if (userData) {
        token.id = userData.id;
        token.name = userData.name ?? null;
        token.phoneNumber = userData.phoneNumber ?? null;
        // deviceId tidak diperlukan - backend sudah handle
        token.backendToken = userData.backendToken;
        token.userData = userData.userData;
        token.site = userData.site;
      }

      return token;
    },
    async session({ token, session }) {
      session.user.id = token.id;
      session.user.name =
        typeof token.name === "string" ? token.name : session.user.name;
      session.user.phoneNumber =
        typeof token.phoneNumber === "string" ? token.phoneNumber : null;
      if (isSiteId(token.site)) {
        session.user.site = token.site;
      }

      return session;
    },
  },
  events: {
    async signIn({ user: _user, account: _account, profile: _profile }) {},
    async signOut() {},
  },
};

export const getAuthSession = () => getServerSession(authOptions);

/**
 * Read the encrypted NextAuth JWT for the current request.
 *
 * We hold the backend's token and the site claim inside this cookie; both are
 * needed to talk to the right raf-bot-v2. Reads the cookie via next-auth/jwt so
 * `backendToken` never has to be copied onto the session (see CLAUDE.md Auth).
 */
async function readJwt() {
  const cookieStore = await cookies();

  // getToken reads cookies from `req.cookies` — its SessionStore ignores a raw
  // `headers.cookie` string entirely. Passing the header worked in dev but
  // returned null in production, where the session cookie is the `__Secure-`
  // prefixed HTTPS variant; every authenticated backend call then 401'd with
  // "User not authenticated". Hand getToken the cookie jar itself: the store
  // from `cookies()` exposes the `getAll()` shape SessionStore expects.
  return getToken({
    req: {
      cookies: cookieStore,
      headers: {},
    } as never,
    secret: process.env.NEXTAUTH_SECRET,
  });
}

export async function getBackendAccessToken(): Promise<string | null> {
  const token = await readJwt();
  return typeof token?.backendToken === "string" ? token.backendToken : null;
}

/** The site this session is pinned to, or null if not logged in. */
export async function getSessionSite(): Promise<SiteId | null> {
  const token = await readJwt();
  return isSiteId(token?.site) ? token.site : null;
}

export interface BackendContext {
  /** Base URL of the raf-bot-v2 backend for this session's site. */
  baseUrl: string;
  /** The backend-issued bearer token. */
  token: string;
  site: SiteId;
}

/**
 * Everything an authenticated backend call needs, resolved from one JWT read:
 * which backend to hit and the token to hit it with. Returns null when the
 * request is not authenticated or predates the multi-tenant `site` claim.
 *
 * Throws only when the site is valid but its `API_URL_<SITE>` is unset — a real
 * deploy misconfiguration that must surface, not be silently rerouted.
 */
export async function getBackendContext(): Promise<BackendContext | null> {
  const token = await readJwt();
  if (
    !token ||
    typeof token.backendToken !== "string" ||
    !isSiteId(token.site)
  ) {
    return null;
  }

  return {
    baseUrl: getSiteApiUrl(token.site),
    token: token.backendToken,
    site: token.site,
  };
}

/**
 * Base URL for a public/unauthenticated backend call. Prefers the session's
 * pinned site when logged in (e.g. the dashboard hitting the public news route).
 * Pre-login there is no site to resolve — customers do not pick one — so branding
 * falls back to DEFAULT_SITE.
 */
export async function getPublicBackendBaseUrl(): Promise<string> {
  const token = await readJwt();
  const site = isSiteId(token?.site) ? token.site : DEFAULT_SITE;
  return getSiteApiUrl(site);
}
