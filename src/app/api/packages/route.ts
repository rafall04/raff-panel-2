import { PackageService } from "@/services/package.service";
import {
  routeFromApiResponse,
  routeFromServerError,
} from "@/lib/route-response";

export async function GET() {
  try {
    const response = await PackageService.getMonthlyPackages();
    return routeFromApiResponse(response, {
      fallbackMessage: "Failed to fetch packages",
      cache: "no-store",
    });
  } catch (error) {
    return routeFromServerError(
      error,
      "An internal server error occurred",
      "packages_route_error",
      { domain: "package" },
    );
  }
}
