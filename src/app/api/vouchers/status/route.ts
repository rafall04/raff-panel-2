import { VoucherService } from "@/services/voucher.service";
import {
  routeFromApiResponse,
  routeFromServerError,
} from "@/lib/route-response";

/**
 * Apakah operator sudah menyalakan pembelian voucher untuk site ini.
 *
 * Dipakai navigasi untuk memutuskan menampilkan menu Voucher atau tidak, jadi ia dipanggil
 * di setiap halaman dashboard — tetap `no-store` (default) karena gate-nya per-site dan
 * boleh berubah tanpa deploy.
 */
export async function GET() {
  try {
    const response = await VoucherService.getFeatureStatus();
    return routeFromApiResponse(response, {
      fallbackMessage: "Gagal memeriksa ketersediaan voucher.",
    });
  } catch (error) {
    return routeFromServerError(
      error,
      "Gagal memeriksa ketersediaan voucher.",
      "voucher_status_error",
    );
  }
}
