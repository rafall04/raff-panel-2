import { PackageChangeService } from "@/services/package-change.service";
import {
  routeFromApiResponse,
  routeFromServerError,
} from "@/lib/route-response";

export async function GET() {
  try {
    const response = await PackageChangeService.getHistory();
    return routeFromApiResponse(response, {
      fallbackMessage: "Failed to fetch package change history",
      cache: "no-store",
    });
  } catch (error) {
    return routeFromServerError(
      error,
      "An internal server error occurred",
      "package_change_history_route_error",
      { domain: "package" },
    );
  }
}
