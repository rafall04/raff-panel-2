import "next-auth";
import "next-auth/jwt";
import type { SiteId } from "@/lib/sites";

declare module "next-auth/jwt" {
  /**
   * Returned by the `jwt` callback and `getToken`, when using JWT sessions
   * This is the shape of the encrypted JWT
   */
  interface JWT {
    id: string;
    name?: string | null;
    phoneNumber?: string | null;
    backendToken: string;
    userData: unknown;
    /** Which raf-bot-v2 backend this session is pinned to. Set once at login. */
    site: SiteId;
  }
}

declare module "next-auth" {
  /**
   * This is the shape of the `user` object returned by the `authorize` callback.
   * It is also what is passed to the `jwt` callback's `user` parameter on initial sign-in.
   */
  interface User {
    id: string;
    name?: string | null;
    phoneNumber?: string | null;
    backendToken: string;
    userData: unknown;
    /** The site the customer picked on the login screen. */
    site: SiteId;
  }

  /**
   * This is the shape of the `session` object returned by `useSession`, `getSession`, etc.
   */
  interface Session {
    user: {
      id: string;
      name?: string | null;
      phoneNumber?: string | null;
      site?: SiteId;
    };
  }
}
