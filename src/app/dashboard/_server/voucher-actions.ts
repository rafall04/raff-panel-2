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
  /** Tarif biaya admin QRIS untuk estimasi di layar konfirmasi. */
  qrisFeeRate: number;
  /** Nomor tujuan kode voucher, ditentukan backend dari sesi. */
  notifyPhone: string | null;
  /**
   * Gate multi-voucher dari backend (`voucherMultiPurchase`). Default OFF — stepper
   * jumlah hanya tampil saat enabled, supaya UI tidak menjanjikan yang ditolak backend.
   */
  multiBuy: { enabled: boolean; maxQty: number };
  /**
   * Gate username/password pilihan pembeli (`voucherCustomCreds`). Default OFF — field
   * kustom hanya tampil saat enabled, dan hanya untuk qty=1.
   */
  customCreds: { enabled: boolean };
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
  const empty: VoucherPageData = {
    enabled: false,
    // 0,7% — nilai jaga-jaga yang hanya terpakai bila halaman entah bagaimana dirender
    // tanpa status; jalur normal selalu memakai angka dari backend.
    qrisFeeRate: 0.007,
    notifyPhone: null,
    multiBuy: { enabled: false, maxQty: 1 },
    customCreds: { enabled: false },
    packages: [],
    history: [],
  };

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

    // Tarif harus berupa angka positif yang masuk akal. Backend lama tidak mengirimnya sama
    // sekali, dan backend yang salah konfigurasi bisa mengirim 0 — keduanya akan membuat
    // layar konfirmasi menampilkan "Biaya admin Rp0", angka yang salah dan menyesatkan.
    const rate = status.data.qrisFeeRate;
    const qrisFeeRate =
      typeof rate === "number" && Number.isFinite(rate) && rate > 0
        ? rate
        : empty.qrisFeeRate;

    const phone = status.data.notifyPhone;

    // Field opsional — backend lama tidak mengirimnya. maxQty < 1 dinormalkan ke 1
    // supaya stepper tak pernah menampilkan batas yang mustahil.
    const rawMulti = status.data.multiBuy;
    const multiBuy =
      rawMulti && rawMulti.enabled === true
        ? {
            enabled: true,
            maxQty: Math.max(1, Math.floor(rawMulti.maxQty) || 1),
          }
        : empty.multiBuy;

    // Field opsional — backend lama tidak mengirimnya; anggap OFF.
    const customCreds =
      status.data.customCreds && status.data.customCreds.enabled === true
        ? { enabled: true }
        : empty.customCreds;

    return {
      enabled: true,
      qrisFeeRate,
      notifyPhone: typeof phone === "string" && phone ? phone : null,
      multiBuy,
      customCreds,
      packages,
      history,
    };
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
 * Buat transaksi QRIS untuk `qty` voucher dari satu paket.
 *
 * Hanya `prof` + `qty` yang dikirim — nomor HP ditentukan backend dari sesi. Tidak ada
 * `revalidatePath` di sini: transaksi baru belum mengubah apa pun yang ter-render
 * di server, dan panel langsung berpindah ke tampilan QRIS di klien.
 * `qty` divalidasi ulang di backend (gate `voucherMultiPurchase` + batas maksimal).
 */
export async function createVoucherPurchase(
  prof: string,
  qty = 1,
  custom?: { username: string; password?: string },
): Promise<CreateVoucherPurchaseResult> {
  if (!prof || typeof prof !== "string") {
    return { success: false, message: "Paket voucher tidak valid." };
  }
  if (!Number.isInteger(qty) || qty < 1) {
    return { success: false, message: "Jumlah voucher tidak valid." };
  }
  // Custom creds hanya untuk 1 voucher — backend menolak kombinasi lain; ditolak di
  // sini lebih dulu supaya pesan tidak bergantung pada versi backend.
  if (custom && qty !== 1) {
    return {
      success: false,
      message: "Username sendiri hanya untuk pembelian 1 voucher.",
    };
  }

  try {
    const { VoucherService } = await import("@/services/voucher.service");
    const response = await VoucherService.createPurchase(prof, qty, custom);

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

export interface VoucherUsernameCheckResult {
  success: boolean;
  available: boolean;
  message?: string;
  username?: string;
  /** HTTP status dari backend (409=dipakai, 503=gagal cek) — untuk gaya pesan di UI. */
  status?: number;
}

/**
 * Probe ketersediaan username kustom untuk UX form (debounced dari klien).
 * Jawaban SEMENTARA — validasi final tetap di createVoucherPurchase (lock backend).
 * 404 dari backend berarti fitur OFF → dianggap "tidak tersedia" tanpa pesan.
 */
export async function checkVoucherUsername(
  name: string,
): Promise<VoucherUsernameCheckResult> {
  const trimmed = String(name || "")
    .trim()
    .toLowerCase();
  if (!trimmed) {
    return { success: false, available: false, message: "Username kosong." };
  }

  try {
    const { VoucherService } = await import("@/services/voucher.service");
    const response = await VoucherService.checkUsername(trimmed);
    const available = response.data?.available === true;
    return {
      success: response.success === true,
      available,
      message: response.message,
      username: response.data?.username,
    };
  } catch (error) {
    if (error instanceof ServerApiError && error.statusCode === 404) {
      return { success: false, available: false, message: "", status: 404 };
    }
    // 4xx lain (username invalid/dipakai) bawa pesan backend yang bisa ditampilkan.
    if (
      error instanceof ServerApiError &&
      error.statusCode >= 400 &&
      error.statusCode < 500 &&
      error.message
    ) {
      return {
        success: false,
        available: false,
        message: error.message,
        status: error.statusCode,
      };
    }
    logPortalServerEvent("error", "voucher_username_check_error", {
      domain: "voucher",
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return {
      success: false,
      available: false,
      message: "Gagal memeriksa username.",
      status: error instanceof ServerApiError ? error.statusCode : undefined,
    };
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
