import { SpeedBoostService } from "@/services/speed-boost.service";
import {
  routeFromApiResponse,
  routeFromServerError,
} from "@/lib/route-response";

export async function GET() {
  try {
    const response = await SpeedBoostService.getAvailableSpeedBoosts();
    return routeFromApiResponse(response, {
      fallbackMessage: "Failed to fetch speed boost availability.",
      cache: "no-store",
    });
  } catch (error) {
    return routeFromServerError(
      error,
      "Failed to fetch speed boost availability.",
      "speed_boost_available_route_error",
      { domain: "speed_boost" },
      { cache: "no-store" },
    );
  }
}
