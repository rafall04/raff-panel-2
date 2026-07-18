"use server";

import { revalidatePath } from "next/cache";
import type { PaymentProofType } from "@/services/payment-proof.service";
import type { SpeedRequestAwaitingProof } from "@/services/speed-boost.service";
import { logPortalServerEvent } from "@/lib/server-log";

/**
 * The speed request waiting on a payment proof, or null.
 *
 * Returns null on failure rather than throwing: this only decides whether to
 * offer an upload box, and a backend hiccup should not take the whole Speed
 * On Demand page down with it.
 */
export async function getSpeedRequestAwaitingProof(): Promise<SpeedRequestAwaitingProof | null> {
  try {
    const { SpeedBoostService } =
      await import("@/services/speed-boost.service");
    const response = await SpeedBoostService.getRequestAwaitingProof();

    if (!response.success) {
      return null;
    }

    return response.data ?? null;
  } catch (error) {
    logPortalServerEvent("error", "speed_request_awaiting_proof_error", {
      domain: "payment",
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return null;
  }
}

export interface UploadPaymentProofResult {
  success: boolean;
  message: string;
  /** Backend HTTP status on failure, so the UI can distinguish "no bill to
   *  settle" (409, final) from "bill unreadable" (503, retryable). */
  status?: number;
}

export async function uploadPaymentProof(
  type: PaymentProofType,
  file: File,
  caption: string = "",
): Promise<UploadPaymentProofResult> {
  try {
    const { PaymentProofService } =
      await import("@/services/payment-proof.service");
    const response = await PaymentProofService.uploadProof(type, file, caption);

    if (!response.success) {
      return {
        success: false,
        status: response.status,
        message: response.message || "Gagal mengirim bukti pembayaran.",
      };
    }

    if (type === "sod") {
      revalidatePath("/dashboard/speed-boost");
      revalidatePath("/dashboard");
    }

    return {
      success: true,
      status: response.status,
      message: response.message || "Bukti pembayaran berhasil dikirim.",
    };
  } catch (error) {
    logPortalServerEvent("error", "payment_proof_upload_error", {
      domain: "payment",
      type,
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return { success: false, message: "Gagal mengirim bukti pembayaran." };
  }
}
