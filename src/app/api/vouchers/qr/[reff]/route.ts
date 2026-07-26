import { NextResponse } from "next/server";
import { VoucherService } from "@/services/voucher.service";
import { routeError, routeFromServerError } from "@/lib/route-response";

/**
 * QRIS untuk satu transaksi voucher, sebagai PNG.
 *
 * Dua langkah, dan urutannya penting:
 *   1. `getPurchase(reff)` — endpoint TERAUTENTIKASI dan ter-scope pemilik. Ini satu-satunya
 *      pemeriksa kepemilikan di jalur ini.
 *   2. baru ambil PNG dari `/app/qr/:reff`, yang di backend ANONIM dan akan melayani reff
 *      milik siapa pun. Membalik urutannya = kebocoran QR antar-pelanggan.
 *
 * QR hanya relevan selagi `state === "pending"`; setelah lunas backend berhenti mengirim
 * `qrString` dan menampilkan QR basi hanya membingungkan.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reff: string }> },
) {
  const { reff } = await params;

  try {
    const purchase = await VoucherService.getPurchase(reff);
    if (!purchase.success || !purchase.data) {
      return routeError("Transaksi tidak ditemukan.", { status: 404 });
    }

    if (purchase.data.state !== "pending") {
      return routeError("Transaksi ini sudah tidak menunggu pembayaran.", {
        status: 409,
      });
    }

    const qr = await VoucherService.fetchQrPng(reff);
    if (!qr.ok) {
      return routeError("Gagal memuat kode QR.", { status: qr.status });
    }

    return new NextResponse(qr.body, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        // QR memuat instruksi bayar milik satu pelanggan — jangan pernah di-cache bersama.
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
      },
    });
  } catch (error) {
    return routeFromServerError(
      error,
      "Gagal memuat kode QR.",
      "voucher_qr_error",
      { reff },
    );
  }
}
