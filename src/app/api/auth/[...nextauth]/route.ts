import { authOptions } from "@/lib/auth";
import NextAuth from "next-auth/next";

// NextAuth handler - must be used directly without wrapper in App Router
// NextAuth automatically handles NextRequest in App Router
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
