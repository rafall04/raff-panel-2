import { NextResponse } from "next/server";
import { DEFAULT_SITE, getSiteApiUrl, isSiteId } from "@/lib/sites";

/**
 * Dev-only connectivity probe. Multi-tenant: pass ?site=DANDER|TANJUNGHARJO to
 * pick a backend, else DEFAULT_SITE.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const siteParam = new URL(request.url).searchParams.get("site");
  const site = isSiteId(siteParam) ? siteParam : DEFAULT_SITE;

  let baseUrl: string;
  try {
    baseUrl = getSiteApiUrl(site);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Site URL not configured",
      },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(`${baseUrl}/api/auth/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: "test", otp: "test" }),
    });

    const text = await response.text();

    return NextResponse.json({
      success: true,
      site,
      backendStatus: response.status,
      backendResponse: text.substring(0, 500),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
