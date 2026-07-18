/**
 * Payment Proof Service
 * Endpoint: POST /api/customer/payment-proof
 *
 * Serves two backend flows behind one endpoint, selected by `type`:
 * - "tagihan" — monthly bill proof, gated by the backend's money gate
 * - "sod"     — proof for a pending Speed On Demand request
 */

import { getBackendAccessToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";

const MAX_PROOF_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_PROOF_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

export type PaymentProofType = "tagihan" | "sod";

export interface PaymentProofResponse {
  id: string;
  status: string;
  type: PaymentProofType;
}

export interface UploadProofResult extends ApiResponse<PaymentProofResponse> {
  /**
   * Backend HTTP status, surfaced so callers can tell apart outcomes that all
   * read as "failed" but mean different things: 409 = nothing to settle (a
   * final answer), 503 = the bill could not be read (worth retrying), 422 =
   * this looks like a complaint, not a payment.
   */
  status?: number;
}

export class PaymentProofService {
  /**
   * Upload a payment proof.
   *
   * Server-only. Like ReportService.uploadPhoto, this bypasses serverApiClient
   * because that client forces Content-Type: application/json and would
   * corrupt the multipart boundary.
   *
   * @param type - Which flow this proof belongs to
   * @param file - Image or PDF, max 5MB
   * @param caption - The customer's own words. Passed through untouched: the
   *   backend's money gate deliberately requires an advance-payment intent to
   *   be stated by the customer rather than guessed, so a synthetic caption
   *   here would defeat that gate for every customer with no outstanding bill.
   */
  static async uploadProof(
    type: PaymentProofType,
    file: File,
    caption: string = "",
  ): Promise<UploadProofResult> {
    if (file.size > MAX_PROOF_SIZE_BYTES) {
      return { success: false, message: "Ukuran file maksimal 5MB" };
    }

    if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
      return {
        success: false,
        message: "Hanya file gambar atau PDF yang diperbolehkan",
      };
    }

    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      return { success: false, message: "API URL is not configured" };
    }

    const token = await getBackendAccessToken();
    if (!token) {
      return { success: false, message: "Unauthorized" };
    }

    const formData = new FormData();
    formData.append("type", type);
    formData.append("caption", caption);
    formData.append("proof", file);

    const response = await fetch(`${apiUrl}/api/customer/payment-proof`, {
      method: "POST",
      // Content-Type is intentionally omitted: fetch derives the multipart boundary.
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
      cache: "no-store",
    });

    const json = (await response.json().catch(() => null)) as {
      message?: string;
      data?: PaymentProofResponse;
    } | null;

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        message: json?.message || "Gagal mengirim bukti pembayaran",
      };
    }

    return {
      success: true,
      status: response.status,
      data: json?.data,
      message: json?.message,
    };
  }
}
