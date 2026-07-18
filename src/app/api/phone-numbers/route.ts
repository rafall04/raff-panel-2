import { PhoneService } from "@/services/phone.service";
import {
  routeFromApiResponse,
  routeFromServerError,
} from "@/lib/route-response";

export async function GET() {
  try {
    const response = await PhoneService.getPhoneNumbers();
    return routeFromApiResponse(response, {
      fallbackMessage: "Failed to fetch phone numbers",
      cache: "no-store",
    });
  } catch (error) {
    return routeFromServerError(
      error,
      "An internal server error occurred",
      "phone_numbers_route_error",
      { domain: "profile" },
    );
  }
}
