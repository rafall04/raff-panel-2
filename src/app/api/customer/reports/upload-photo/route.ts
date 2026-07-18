import { getAuthSession } from "@/lib/auth";
import { ReportService } from "@/services/report.service";
import { routeError, routeSuccess } from "@/lib/route-response";
import { logPortalServerEvent } from "@/lib/server-log";

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.id) {
      return routeError("Unauthorized", { status: 401 });
    }

    const formData = await request.formData();
    const ticketId = formData.get("ticketId") as string | null;
    const photo = formData.get("photo") as File | null;

    if (!ticketId) {
      return routeError("Ticket ID is required", { status: 400 });
    }

    if (!photo || !(photo instanceof File)) {
      return routeError("Photo file is required", { status: 400 });
    }

    const response = await ReportService.uploadPhoto(ticketId, photo);

    if (!response.success) {
      return routeError(response.message || "Failed to upload photo", {
        status: 400,
      });
    }

    return routeSuccess(
      response.data ?? null,
      response.message || "Photo uploaded successfully",
      { cache: "no-store" },
    );
  } catch (error) {
    logPortalServerEvent("error", "report_upload_photo_route_error", {
      domain: "report",
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return routeError("Internal server error", { status: 500 });
  }
}
