import { SpeedBoostService } from "@/services/speed-boost.service";
import { routeFromServerError, routeSuccess } from "@/lib/route-response";

export async function GET() {
  try {
    const response = await SpeedBoostService.getSpeedBoostStatus();

    return routeSuccess(
      {
        enabled: response.success && response.data?.enabled === true,
      },
      response.message,
      {
        cache: "no-store",
      },
    );
  } catch (error) {
    return routeFromServerError(
      error,
      "Failed to fetch speed boost status.",
      "speed_boost_status_route_error",
      { domain: "speed_boost" },
      { cache: "no-store" },
    );
  }
}
