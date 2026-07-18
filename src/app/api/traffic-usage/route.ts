import { CustomerTrafficService } from "@/services/customer-traffic.service";
import {
  routeFromApiResponse,
  routeFromServerError,
} from "@/lib/route-response";

export async function GET() {
  try {
    const response = await CustomerTrafficService.getTrafficUsage();
    return routeFromApiResponse(response, {
      fallbackMessage: "Failed to fetch traffic usage.",
      cache: "no-store",
      badRequestStatus: 503,
    });
  } catch (error) {
    return routeFromServerError(
      error,
      "Failed to fetch traffic usage.",
      "traffic_usage_route_error",
      { domain: "traffic_usage" },
      { cache: "no-store" },
    );
  }
}
