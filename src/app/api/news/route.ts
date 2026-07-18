import { routeError, routeSuccess } from "@/lib/route-response";
import { logPortalServerEvent } from "@/lib/server-log";

export async function GET() {
  if (!process.env.API_URL) {
    return routeError("Server configuration error.", {
      status: 500,
      event: "news_config_error",
      context: { domain: "news" },
    });
  }

  try {
    const backendResponse = await fetch(`${process.env.API_URL}/api/news`, {
      cache: "no-store", // Always fetch fresh data
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });

    if (!backendResponse.ok) {
      return routeError("Failed to fetch news.", {
        status: backendResponse.status,
        event: "news_backend_error",
        context: { domain: "news", status: backendResponse.status },
      });
    }

    const payload = (await backendResponse.json()) as {
      data?: Array<{
        id: string;
        title?: string;
        content?: string;
        createdAt?: string;
        created_at?: string;
      }>;
      message?: string;
    };

    const news = Array.isArray(payload.data)
      ? payload.data.map((item) => ({
          id: item.id,
          title: item.title || "",
          content: item.content || "",
          createdAt: item.createdAt || item.created_at || "",
        }))
      : [];

    return routeSuccess(news, payload.message || "News fetched", {
      cache: "no-store",
    });
  } catch (error) {
    logPortalServerEvent("error", "news_fetch_error", {
      domain: "news",
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return routeError("An internal server error occurred.", {
      status: 500,
      cache: "no-store",
    });
  }
}
