import { routeSuccess } from "@/lib/route-response";
import { logPortalServerEvent } from "@/lib/server-log";
import { getPublicBackendBaseUrl } from "@/lib/auth";

export async function GET() {
  let baseUrl: string;
  try {
    baseUrl = await getPublicBackendBaseUrl();
  } catch {
    return routeSuccess({ companyName: "WiFi Portal" }, undefined, {
      cache: "revalidate",
    });
  }

  try {
    const response = await fetch(`${baseUrl}/api/wifi-name`, {
      next: { revalidate: 3600 },
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json().catch(() => null);
    const companyName = data?.data?.wifiName || data?.wifiName || "WiFi Portal";

    return routeSuccess({ companyName }, undefined, {
      cache: "revalidate",
    });
  } catch (error) {
    logPortalServerEvent("warn", "settings_company_name_fallback", {
      domain: "settings",
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return routeSuccess({ companyName: "WiFi Portal" }, undefined, {
      cache: "revalidate",
    });
  }
}
