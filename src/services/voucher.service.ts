/**
 * Voucher Service
 *
 * Beli voucher hotspot dari panel pelanggan. Backend: raf-bot-v2 sub-router
 * `/api/customer/vouchers/*` (boundary b181), di belakang `ensureCustomerAuthenticated`.
 *
 * Dua hal yang ditentukan backend dan tidak boleh diduplikasi di sini:
 * - Nomor HP pembeli diambil dari sesi (`req.customer.phone_number`). Panel TIDAK PERNAH
 *   mengirim nomor — kalau kode di sini mulai mengirimnya, itu bug keamanan.
 * - Kode voucher hanya terbit lewat callback iPaymu yang terverifikasi server-to-server.
 *   Panel murni mem-polling status; tidak ada jalur "tandai lunas" dari sisi klien.
 */

import { serverApiClient } from "@/lib/api-server";
import { getBackendContext } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";

/** Status transaksi sebagaimana diturunkan backend dari record payment. */
export type VoucherPurchaseState =
  | "pending" // QRIS terbit, menunggu dibayar
  | "processing" // sudah lunas, voucher belum tercatat (jendela sangat singkat)
  | "completed" // kode voucher siap
  | "failed"; // sudah lunas tapi voucher gagal terbit — admin sudah di-alert

export interface VoucherPackage {
  prof: string;
  name: string;
  duration: string | null;
  price: number;
  featured: boolean;
}

export interface VoucherPurchase {
  reff: string;
  state: VoucherPurchaseState;
  paid: boolean;
  prof: string | null;
  amount: number;
  /** Harga voucher tanpa biaya admin — angka NYATA dari record transaksi. */
  subtotal: number;
  /** Biaya admin QRIS yang benar-benar ditagihkan iPaymu (bukan estimasi). */
  fee: number;
  total: number | null;
  /** Hanya terisi saat `state === "pending"`; backend menyembunyikannya setelah lunas. */
  qrString: string | null;
  voucherCode: string | null;
  /**
   * Jumlah voucher dalam transaksi ini (pembelian multi-voucher, gate backend
   * `voucherMultiPurchase`). Opsional: backend lama tidak mengirimnya — anggap 1.
   */
  qty?: number;
  /** Semua kode batch. `voucherCode` di atas tetap ada sebagai gabungan string. */
  voucherCodes?: string[];
  /** Lunas tapi kode yang terbit kurang dari qty — sisanya diproses admin. */
  partial?: boolean;
  /**
   * Username pilihan pembeli (custom creds). Untuk pembelian ini `voucherCodes` berisi
   * username-nya; password hanya dikirim backend setelah lunas.
   */
  customUser?: string | null;
  /** Password kustom — hanya terisi saat lunas; null untuk voucher kode acak. */
  customPass?: string | null;
  createdAt: number | null;
  expiredAt: number | null;
}

export interface VoucherCheckout {
  reff: string;
  prof: string;
  packageName: string;
  /** Jumlah voucher dalam batch ini; backend lama tidak mengirimnya — anggap 1. */
  qty?: number;
  /** Harga satuan voucher; `amount` adalah unitPrice × qty. */
  unitPrice?: number;
  amount: number;
  total: number;
  fee: number;
  qrString: string;
  expiredAt: number | null;
}

export interface VoucherFeatureStatus {
  enabled: boolean;
  /**
   * Tarif biaya admin QRIS iPaymu (mis. 0.007 = 0,7%), untuk ESTIMASI di layar konfirmasi
   * sebelum transaksi dibuat. Angka pasti datang dari `fee` pada transaksi. Datang dari
   * backend supaya tidak ada konstanta kembar di repo ini.
   *
   * Opsional DENGAN SENGAJA: panel dan backend di-deploy terpisah, jadi panel versi baru
   * bisa berjalan sebentar di atas backend yang belum mengirim field ini.
   */
  qrisFeeRate?: number;
  /** Nomor utama yang akan menerima kode voucher, sudah dinormalkan backend. */
  notifyPhone?: string | null;
  /**
   * Gate pembelian multi-voucher (backend `config.voucherMultiPurchase`, di-toggle dari
   * /config tab Voucher). Opsional: backend lama tidak mengirimnya — anggap OFF dan
   * jangan tampilkan stepper jumlah sama sekali.
   */
  multiBuy?: { enabled: boolean; maxQty: number };
  /**
   * Gate username/password pilihan pembeli (backend `config.voucherCustomCreds`).
   * Opsional: backend lama tidak mengirimnya — anggap OFF dan sembunyikan field kustom.
   * Hanya berlaku untuk qty=1 (satu username tidak bisa dibagi banyak voucher).
   */
  customCreds?: { enabled: boolean };
}

export class VoucherService {
  /**
   * Cek apakah operator sudah mengaktifkan fitur (`config.customerVoucher.enabled`).
   * Endpoint: GET /api/customer/vouchers/status
   *
   * Default backend adalah OFF, jadi panel harus menyembunyikan menunya sampai ini true.
   */
  static async getFeatureStatus(): Promise<ApiResponse<VoucherFeatureStatus>> {
    return serverApiClient.get<VoucherFeatureStatus>(
      "/api/customer/vouchers/status",
    );
  }

  /**
   * Daftar paket voucher yang bisa dibeli.
   * Endpoint: GET /api/customer/vouchers/packages
   *
   * 503 bila fitur belum diaktifkan.
   */
  static async getPackages(): Promise<ApiResponse<VoucherPackage[]>> {
    return serverApiClient.get<VoucherPackage[]>(
      "/api/customer/vouchers/packages",
    );
  }

  /**
   * Buat transaksi QRIS untuk `qty` voucher dari satu paket (SATU transaksi per batch).
   * Endpoint: POST /api/customer/vouchers/purchase
   *
   * Body `{ prof, qty }` — nomor HP sengaja tidak dikirim (lihat catatan di atas).
   * `qty > 1` hanya lolos bila backend mengaktifkan `voucherMultiPurchase`.
   * Dibatasi 10 transaksi / 15 menit per pelanggan di backend.
   */
  static async createPurchase(
    prof: string,
    qty = 1,
    custom?: { username: string; password?: string },
  ): Promise<ApiResponse<VoucherCheckout>> {
    return serverApiClient.post<VoucherCheckout>(
      "/api/customer/vouchers/purchase",
      {
        prof,
        qty,
        // Kredensial pilihan pembeli — backend menormalisasi + cek duplikat (qty=1 saja).
        ...(custom
          ? { customUser: custom.username, customPass: custom.password }
          : {}),
      },
    );
  }

  /**
   * Probe ketersediaan username kustom untuk UX form. Jawaban SEMENTARA — validasi final
   * tetap di POST /purchase (di dalam lock backend). 404 bila fitur custom creds OFF.
   * Endpoint: GET /api/customer/vouchers/check-user?name=
   */
  static async checkUsername(
    name: string,
  ): Promise<ApiResponse<{ available: boolean; username?: string }>> {
    return serverApiClient.get<{ available: boolean; username?: string }>(
      `/api/customer/vouchers/check-user?name=${encodeURIComponent(name)}`,
    );
  }

  /**
   * Status satu transaksi milik pelanggan yang sedang login.
   * Endpoint: GET /api/customer/vouchers/purchase/:reff
   *
   * Backend membalas 404 untuk transaksi milik orang lain — jangan perlakukan 404
   * sebagai "belum siap" lalu dipolling selamanya.
   */
  static async getPurchase(
    reff: string,
  ): Promise<ApiResponse<VoucherPurchase>> {
    return serverApiClient.get<VoucherPurchase>(
      `/api/customer/vouchers/purchase/${encodeURIComponent(reff)}`,
    );
  }

  /**
   * Riwayat pembelian voucher pelanggan ini (terbaru dulu).
   * Endpoint: GET /api/customer/vouchers/history
   */
  static async getHistory(
    limit?: number,
  ): Promise<ApiResponse<VoucherPurchase[]>> {
    const query =
      typeof limit === "number" && Number.isFinite(limit)
        ? `?limit=${encodeURIComponent(String(limit))}`
        : "";
    return serverApiClient.get<VoucherPurchase[]>(
      `/api/customer/vouchers/history${query}`,
    );
  }

  /**
   * Ambil QRIS sebagai PNG dari backend.
   * Endpoint backend: GET /app/qr/:reff (renderer `qr-image` milik raf-bot-v2).
   *
   * Endpoint itu ANONIM dan tidak memeriksa kepemilikan, jadi pemanggil WAJIB
   * memverifikasi kepemilikan lebih dulu lewat `getPurchase(reff)` — lihat
   * [route.ts](src/app/api/vouchers/qr/[reff]/route.ts). Memakai raw fetch (bukan
   * `serverApiClient`) karena responsnya biner, bukan amplop JSON; pola yang sama
   * dipakai upload multipart di `report.service.ts`.
   */
  static async fetchQrPng(
    reff: string,
  ): Promise<{ ok: true; body: ArrayBuffer } | { ok: false; status: number }> {
    const ctx = await getBackendContext();
    if (!ctx) {
      return { ok: false, status: 401 };
    }

    const response = await fetch(
      `${ctx.baseUrl}/app/qr/${encodeURIComponent(reff)}`,
      {
        headers: { Authorization: `Bearer ${ctx.token}` },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return { ok: false, status: response.status };
    }

    return { ok: true, body: await response.arrayBuffer() };
  }
}
