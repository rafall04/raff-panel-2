import { routeError, routeSuccess } from "@/lib/route-response";
import { logPortalServerEvent } from "@/lib/server-log";
import { getPublicBackendBaseUrl } from "@/lib/auth";

/**
 * Public endpoint untuk mendapatkan WiFi name dari config
 * Endpoint: GET /api/wifi-name
 * Authentication: Tidak diperlukan (public endpoint)
 * Response format: { status: 200, message: "...", data: { wifiName: "..." } }
 *
 * Multi-tenant: the site comes from the session's `site` claim when logged in
 * (the dashboard calls this), else the pre-login preferred site.
 */
export async function GET() {
  let baseUrl: string;
  try {
    baseUrl = await getPublicBackendBaseUrl();
  } catch {
    return routeError("Server configuration error.", {
      status: 500,
      event: "wifi_name_config_error",
      context: { domain: "settings" },
      cache: "revalidate",
    });
  }

  try {
    const backendResponse = await fetch(`${baseUrl}/api/wifi-name`, {
      next: { revalidate: 3600 }, // Cache for 1 hour, as this likely doesn't change often
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!backendResponse.ok) {
      return routeError("Failed to fetch wifi name from backend.", {
        status: backendResponse.status,
        event: "wifi_name_backend_error",
        context: { domain: "settings", status: backendResponse.status },
        cache: "revalidate",
      });
    }

    const data = (await backendResponse.json()) as {
      message?: string;
      data?: { wifiName?: string };
      wifiName?: string;
    };

    return routeSuccess(
      {
        wifiName: data.wifiName || data.data?.wifiName || "Default WiFi Name",
      },
      data.message || "Nama WiFi berhasil diambil",
      {
        cache: "revalidate",
      },
    );
  } catch (error) {
    logPortalServerEvent("error", "wifi_name_fetch_error", {
      domain: "settings",
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return routeError("Terjadi kesalahan pada server.", {
      status: 500,
      cache: "revalidate",
    });
  }
}
