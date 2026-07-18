import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Read a JWT's `exp` without verifying it.
 *
 * We hold the backend's token but not the secret that signed it, and we do not
 * need it: this is only deciding whether to send the customer to /login early
 * rather than letting them walk into a dashboard that will fail every call.
 * The backend still verifies the signature on every request.
 *
 * Fails open (returns false) on anything unparseable — the backend, not this
 * guess, gets the final say.
 */
function isBackendTokenExpired(token: string): boolean {
  const payloadSegment = token.split(".")[1];
  if (!payloadSegment) {
    return false;
  }

  try {
    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    // atob, not Buffer: this runs on the Edge runtime.
    const payload = JSON.parse(atob(padded)) as { exp?: number };

    if (typeof payload.exp !== "number") {
      return false;
    }

    return payload.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

/**
 * The NextAuth session lasts 7 days but the backend token inside it lasts 12
 * hours. Without this check a customer stays "logged in" for days while every
 * backend call 401s, and the swallowed errors surface as a generic "check your
 * connection" — advice that is both wrong and unactionable.
 */
export default withAuth((req) => {
  const token = req.nextauth.token;
  const backendToken = token?.backendToken;

  // A session minted before multi-tenant support carries no `site` claim, so no
  // backend call can be routed. Treat it like an expired session and force a
  // fresh login (which now pins a site). Kept as inline literals so the Edge
  // middleware bundle need not import the site registry — src/lib/sites.ts is
  // the source of truth for these ids.
  const siteMissing =
    token?.site !== "DANDER" && token?.site !== "TANJUNGHARJO";

  const needsReauth =
    siteMissing ||
    (typeof backendToken === "string" && isBackendTokenExpired(backendToken));

  if (!needsReauth) {
    return NextResponse.next();
  }

  // Redirecting a fetch() would hand the caller an HTML login page where it
  // expects JSON. Let route handlers answer 401 on their own terms.
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("reason", "session-expired");
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
