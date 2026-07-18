import "next-auth";
import "next-auth/jwt";

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
  }

  /**
   * This is the shape of the `session` object returned by `useSession`, `getSession`, etc.
   */
  interface Session {
    user: {
      id: string;
      name?: string | null;
      phoneNumber?: string | null;
    };
  }
}
