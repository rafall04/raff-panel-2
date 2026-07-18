import { PhoneService } from "@/services/phone.service";
import {
  routeError,
  routeFromApiResponse,
  routeFromServerError,
} from "@/lib/route-response";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ phoneNumber: string }> },
) {
  try {
    // In Next.js 15, params is a Promise that needs to be awaited
    const { phoneNumber: phoneNumberParam } = await params;
    const phoneNumber = decodeURIComponent(phoneNumberParam);

    if (!phoneNumber) {
      return routeError("Phone number is required", { status: 400 });
    }

    const response = await PhoneService.removePhoneNumber(phoneNumber);
    return routeFromApiResponse(response, {
      fallbackMessage: "Failed to remove phone number",
      cache: "no-store",
    });
  } catch (error) {
    return routeFromServerError(
      error,
      "An internal server error occurred",
      "phone_number_remove_route_error",
      { domain: "profile" },
    );
  }
}
