import { BillingService } from "@/services/billing.service";
import {
  routeFromApiResponse,
  routeFromServerError,
} from "@/lib/route-response";

export async function GET() {
  try {
    const response = await BillingService.getHistory();
    return routeFromApiResponse(response, {
      fallbackMessage: "Gagal mengambil riwayat tagihan",
      cache: "no-store",
    });
  } catch (error) {
    return routeFromServerError(
      error,
      "Terjadi kesalahan pada server",
      "billing_history_route_error",
      { domain: "billing" },
    );
  }
}
