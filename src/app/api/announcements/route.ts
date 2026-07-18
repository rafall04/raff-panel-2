import { routeError, routeSuccess } from "@/lib/route-response";
import { logPortalServerEvent } from "@/lib/server-log";

export async function GET() {
  if (!process.env.API_URL) {
    return routeError("Server configuration error.", {
      status: 500,
      event: "announcements_config_error",
      context: { domain: "announcements" },
    });
  }

  try {
    const backendResponse = await fetch(
      `${process.env.API_URL}/api/announcements`,
      {
        cache: "no-store", // Always fetch fresh data
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );

    if (!backendResponse.ok) {
      return routeError("Failed to fetch announcements.", {
        status: backendResponse.status,
        event: "announcements_backend_error",
        context: {
          domain: "announcements",
          status: backendResponse.status,
        },
      });
    }

    const payload = (await backendResponse.json()) as {
      data?: Array<{
        id: string;
        message?: string;
        title?: string;
        createdAt?: string;
        created_at?: string;
      }>;
      message?: string;
    };

    const announcements = Array.isArray(payload.data)
      ? payload.data.map((item) => ({
          id: item.id,
          message: item.message || item.title || "",
          createdAt: item.createdAt || item.created_at || "",
        }))
      : [];

    return routeSuccess(
      announcements,
      payload.message || "Announcements fetched",
      {
        cache: "no-store",
      },
    );
  } catch (error) {
    logPortalServerEvent("error", "announcements_fetch_error", {
      domain: "announcements",
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return routeError("An internal server error occurred.", {
      status: 500,
      cache: "no-store",
    });
  }
}
