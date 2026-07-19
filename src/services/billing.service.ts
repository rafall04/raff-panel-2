/**
 * Billing Service — customer payment/settlement history.
 * Backed by GET /api/customer/billing-history (raf-bot-v2 `payment_history`).
 */

import { serverApiClient } from "@/lib/api-server";
import type { ApiResponse } from "@/types/api";

export interface BillingHistoryItem {
  id: number;
  periodMonth: number;
  periodYear: number;
  amountDue: number;
  amountPaid: number;
  amountRemaining: number;
  paymentMethod: string | null;
  isPartial: boolean;
  status: "paid" | "partial";
  notes: string | null;
  createdAt: string;
}

export class BillingService {
  /**
   * Payment history for the authenticated customer, newest first.
   * Endpoint: GET /api/customer/billing-history
   */
  static async getHistory(): Promise<ApiResponse<BillingHistoryItem[]>> {
    return serverApiClient.get<BillingHistoryItem[]>(
      "/api/customer/billing-history",
    );
  }
}
