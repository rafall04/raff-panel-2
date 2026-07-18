import { PhoneService } from "@/services/phone.service";
import {
  routeError,
  routeFromApiResponse,
  routeFromServerError,
} from "@/lib/route-response";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber || typeof phoneNumber !== "string") {
      return routeError("Phone number is required", { status: 400 });
    }

    const response = await PhoneService.addPhoneNumber(phoneNumber);
    return routeFromApiResponse(response, {
      fallbackMessage: "Failed to add phone number",
      cache: "no-store",
    });
  } catch (error) {
    return routeFromServerError(
      error,
      "An internal server error occurred",
      "phone_number_add_route_error",
      { domain: "profile" },
    );
  }
}
