import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { cookies } from "next/headers";
import { verify, verifyPassword } from "@/utils/auth.server";

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
      }

      return token;
    },
    async session({ token, session }) {
      session.user.id = token.id;
      session.user.name =
        typeof token.name === "string" ? token.name : session.user.name;
      session.user.phoneNumber =
        typeof token.phoneNumber === "string" ? token.phoneNumber : null;

      return session;
    },
  },
  events: {
    async signIn({ user: _user, account: _account, profile: _profile }) {},
    async signOut() {},
  },
};

export const getAuthSession = () => getServerSession(authOptions);

export async function getBackendAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(
      (cookie: { name: string; value: string }) =>
        `${cookie.name}=${cookie.value}`,
    )
    .join("; ");

  if (!cookieHeader) {
    return null;
  }

  const token = await getToken({
    req: {
      headers: {
        cookie: cookieHeader,
      },
    } as never,
    secret: process.env.NEXTAUTH_SECRET,
  });

  return typeof token?.backendToken === "string" ? token.backendToken : null;
}
