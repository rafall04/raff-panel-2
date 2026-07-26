"use server";

import type {
  VoucherCheckout,
  VoucherPackage,
  VoucherPurchase,
} from "@/services/voucher.service";
import { ServerApiError } from "@/lib/api-server";
import { logPortalServerEvent } from "@/lib/server-log";

export interface VoucherPageData {
  /** False bila operator belum menyalakan `customerVoucher.enabled` di backend. */
  enabled: boolean;
  packages: VoucherPackage[];
  history: VoucherPurchase[];
}

/**
 * Data awal halaman voucher.
 *
 * Sengaja tidak pernah melempar: kalau backend bermasalah, halaman tampil sebagai
 * "fitur tidak tersedia" alih-alih menjatuhkan seluruh dashboard. Paket dan riwayat
 * diambil berurutan setelah gate diketahui aktif — memanggilnya saat fitur mati hanya
 * menghasilkan 503 yang pasti.
 */
export async function getVoucherPageData(): Promise<VoucherPageData> {
  const empty: VoucherPageData = { enabled: false, packages: [], history: [] };

  try {
    const { VoucherService } = await import("@/services/voucher.service");

    const status = await VoucherService.getFeatureStatus();
    if (!status.success || status.data?.enabled !== true) {
      return empty;
    }

    // allSettled, bukan all: `serverApiClient` MELEMPAR pada non-2xx, jadi satu riwayat
    // yang gagal akan menjatuhkan seluruh halaman ke "fitur tidak tersedia" — padahal
    // daftar paketnya baik-baik saja dan pelanggan masih bisa membeli.
    const [packagesResult, historyResult] = await Promise.allSettled([
      VoucherService.getPackages(),
      VoucherService.getHistory(),
    ]);

    const packages =
      packagesResult.status === "fulfilled" && packagesResult.value.success
        ? (packagesResult.value.data ?? [])
        : [];
    const history =
      historyResult.status === "fulfilled" && historyResult.value.success
        ? (historyResult.value.data ?? [])
        : [];

    return { enabled: true, packages, history };
  } catch (error) {
    logPortalServerEvent("error", "voucher_page_data_error", {
      domain: "voucher",
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return empty;
  }
}

export interface CreateVoucherPurchaseResult {
  success: boolean;
  message: string;
  data?: VoucherCheckout;
}

/**
 * Buat transaksi QRIS untuk satu paket.
 *
 * Hanya `prof` yang dikirim — nomor HP ditentukan backend dari sesi. Tidak ada
 * `revalidatePath` di sini: transaksi baru belum mengubah apa pun yang ter-render
 * di server, dan panel langsung berpindah ke tampilan QRIS di klien.
 */
export async function createVoucherPurchase(
  prof: string,
): Promise<CreateVoucherPurchaseResult> {
  if (!prof || typeof prof !== "string") {
    return { success: false, message: "Paket voucher tidak valid." };
  }

  try {
    const { VoucherService } = await import("@/services/voucher.service");
    const response = await VoucherService.createPurchase(prof);

    if (!response.success || !response.data) {
      return {
        success: false,
        message: response.message || "Gagal membuat transaksi pembayaran.",
      };
    }

    return {
      success: true,
      message: response.message || "Transaksi dibuat.",
      data: response.data,
    };
  } catch (error) {
    logPortalServerEvent("error", "voucher_purchase_create_error", {
      domain: "voucher",
      prof,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    // `serverApiClient` MELEMPAR pada non-2xx, jadi tanpa ini setiap penolakan backend —
    // "belum punya nomor HP", "paket tidak ditemukan", rate limit — sampai ke pelanggan
    // sebagai "Gagal membuat transaksi pembayaran." yang tidak bisa ditindaklanjuti.
    // Hanya 4xx yang diteruskan: pesan 5xx bisa membawa detail internal.
    if (
      error instanceof ServerApiError &&
      error.statusCode >= 400 &&
      error.statusCode < 500 &&
      error.message
    ) {
      return { success: false, message: error.message };
    }

    return { success: false, message: "Gagal membuat transaksi pembayaran." };
  }
}

export interface VoucherPurchaseStatusResult {
  success: boolean;
  message?: string;
  data?: VoucherPurchase;
  /**
   * True bila transaksi tidak ditemukan (404). Polling HARUS berhenti saat ini true —
   * backend membalas 404 juga untuk transaksi milik pelanggan lain, jadi menganggapnya
   * "belum siap" berarti memolling selamanya.
   */
  notFound?: boolean;
}

export async function getVoucherPurchaseStatus(
  reff: string,
): Promise<VoucherPurchaseStatusResult> {
  if (!reff) {
    return { success: false, message: "Ref transaksi kosong.", notFound: true };
  }

  try {
    const { VoucherService } = await import("@/services/voucher.service");
    const response = await VoucherService.getPurchase(reff);

    if (!response.success || !response.data) {
      return {
        success: false,
        message: response.message || "Transaksi tidak ditemukan.",
      };
    }

    return { success: true, data: response.data };
  } catch (error) {
    // Backend membalas 404 untuk reff yang tidak ada MAUPUN milik pelanggan lain, dan
    // `serverApiClient` melemparkannya sebagai ServerApiError. Keduanya final — polling
    // harus berhenti, bukan menunggu status yang tidak akan pernah berubah.
    if (error instanceof ServerApiError && error.statusCode === 404) {
      return {
        success: false,
        notFound: true,
        message: "Transaksi tidak ditemukan.",
      };
    }

    logPortalServerEvent("error", "voucher_purchase_status_error", {
      domain: "voucher",
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return { success: false, message: "Gagal memeriksa status transaksi." };
  }
}

/** Riwayat pembelian, dipakai untuk menyegarkan daftar setelah satu transaksi selesai. */
export async function getVoucherHistory(): Promise<VoucherPurchase[]> {
  try {
    const { VoucherService } = await import("@/services/voucher.service");
    const response = await VoucherService.getHistory();
    return response.success ? (response.data ?? []) : [];
  } catch (error) {
    logPortalServerEvent("error", "voucher_history_error", {
      domain: "voucher",
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return [];
  }
}
