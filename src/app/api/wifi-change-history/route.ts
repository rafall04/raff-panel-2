import { WifiHistoryService } from "@/services/wifi-history.service";
import {
  routeFromApiResponse,
  routeFromServerError,
} from "@/lib/route-response";

export async function GET() {
  try {
    const response = await WifiHistoryService.getChangeHistory();
    return routeFromApiResponse(response, {
      fallbackMessage: "Gagal mengambil riwayat perubahan WiFi",
      cache: "no-store",
    });
  } catch (error) {
    return routeFromServerError(
      error,
      "Terjadi kesalahan pada server",
      "wifi_change_history_route_error",
      { domain: "wifi" },
    );
  }
}
