import { CustomerTrafficService } from "@/services/customer-traffic.service";
import {
  routeFromApiResponse,
  routeFromServerError,
} from "@/lib/route-response";

export async function GET() {
  try {
    const response = await CustomerTrafficService.getTrafficLive();
    return routeFromApiResponse(response, {
      fallbackMessage: "Failed to fetch live traffic.",
      cache: "no-store",
      badRequestStatus: 503,
    });
  } catch (error) {
    return routeFromServerError(
      error,
      "Failed to fetch live traffic.",
      "traffic_live_route_error",
      { domain: "traffic_live" },
      { cache: "no-store" },
    );
  }
}
