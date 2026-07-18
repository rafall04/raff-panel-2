import { CustomerTrafficService } from "@/services/customer-traffic.service";
import { routeFromServerError, routeSuccess } from "@/lib/route-response";

export async function GET() {
  try {
    const response = await CustomerTrafficService.getTrafficUsageStatus();

    return routeSuccess(
      {
        enabled: response.success && response.data?.enabled === true,
        usageEnabled: response.success && response.data?.usageEnabled === true,
        liveEnabled: response.success && response.data?.liveEnabled === true,
      },
      response.message,
      { cache: "no-store" },
    );
  } catch (error) {
    return routeFromServerError(
      error,
      "Failed to fetch traffic usage status.",
      "traffic_usage_status_route_error",
      { domain: "traffic_usage" },
      { cache: "no-store" },
    );
  }
}
