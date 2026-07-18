/**
 * Speed Boost Service
 * Handles all Speed On Demand / Speed Boost API calls
 * Based on API_DOCUMENTATION_CUSTOMER_FRONTEND.md v2.0.0
 */

import { serverApiClient } from "@/lib/api-server";
import type { ApiResponse } from "@/types/api";

export type SpeedBoostDurationKey = "1_day" | "3_days" | "7_days";

export interface SpeedBoostDuration {
  label: string;
  hours: number;
  price: number;
}

/**
 * A boost package from GET /api/customer/speed-boost/available.
 *
 * This mirrors what raf-bot-v2's `getAvailableSpeedBoosts` actually sends
 * (lib/services/speed-request-service.js:347-352). The previous shape here
 * (`price`, `speed`, numeric durations) described a *different* endpoint,
 * `/api/speed-boost/packages`, and reading `.price` off this payload crashed
 * the page.
 *
 * `durations` is Partial on purpose: the backend only emits a key when that
 * duration has a configured price (`speed-request-service.js:336`), so
 * "3_days"/"7_days" are routinely absent.
 */
export interface SpeedBoostPackage {
  name: string;
  profile: string;
  basePrice: number;
  durations: Partial<Record<SpeedBoostDurationKey, SpeedBoostDuration>>;
}

// Active Speed Boost Response
export interface ActiveSpeedBoost {
  requestId: string;
  requestedPackageName: string;
  durationKey: "1_day" | "3_days" | "7_days";
  status: "pending" | "approved" | "rejected" | "expired";
  paymentStatus: "pending" | "paid" | "failed";
  startDate: string;
  endDate: string;
  paymentAmount: number;
  paymentMethod: "cash" | "transfer" | "double_billing";
}

// Speed Boost History Item
export interface SpeedBoostHistoryItem {
  requestId: string;
  requestedPackageName: string;
  durationKey: "1_day" | "3_days" | "7_days";
  status: "pending" | "approved" | "rejected" | "expired";
  paymentStatus: "pending" | "paid" | "failed";
  createdAt: string;
  paymentAmount: number;
  paymentMethod: "cash" | "transfer" | "double_billing";
}

// Request Speed Boost
export interface RequestSpeedBoostRequest {
  targetPackageName: string;
  duration: "1_day" | "3_days" | "7_days";
  paymentMethod?: "cash" | "transfer" | "double_billing";
}

export interface RequestSpeedBoostResponse {
  requestId: string;
  paymentMethod: "cash" | "transfer" | "double_billing";
  amount: number;
  needsPaymentProof: boolean;
}

// Cancel Speed Boost Request
export interface CancelSpeedBoostRequest {
  requestId: string;
}

// Speed Boost Status Response
export interface SpeedBoostStatus {
  enabled: boolean;
}

/**
 * A speed request that has been submitted but still needs a payment proof.
 * Separate from ActiveSpeedBoost, which only covers boosts already running.
 */
export interface SpeedRequestAwaitingProof {
  id: string;
  requestedPackageName: string;
  durationKey: "1_day" | "3_days" | "7_days";
  price: number;
  paymentMethod: "cash" | "transfer";
  createdAt: string;
}

export class SpeedBoostService {
  /**
   * Check if Speed On Demand feature is enabled
   * Endpoint: GET /api/customer/speed-boost/status
   *
   * Returns { enabled: boolean } to check feature status
   */
  static async getSpeedBoostStatus(): Promise<ApiResponse<SpeedBoostStatus>> {
    return serverApiClient.get<SpeedBoostStatus>(
      "/api/customer/speed-boost/status",
    );
  }

  /**
   * Check feature availability and get available speed boost packages
   * Endpoint: GET /api/customer/speed-boost/available
   *
   * Returns 503 if feature is disabled
   */
  static async getAvailableSpeedBoosts(): Promise<
    ApiResponse<SpeedBoostPackage[]>
  > {
    return serverApiClient.get<SpeedBoostPackage[]>(
      "/api/customer/speed-boost/available",
    );
  }

  /**
   * Get active speed boost
   * Endpoint: GET /api/customer/speed-requests/active
   *
   * Returns null in data if no active boost
   */
  static async getActiveSpeedBoost(): Promise<
    ApiResponse<ActiveSpeedBoost | null>
  > {
    return serverApiClient.get<ActiveSpeedBoost | null>(
      "/api/customer/speed-requests/active",
    );
  }

  /**
   * Get speed boost history
   * Endpoint: GET /api/customer/speed-requests/history
   */
  static async getSpeedBoostHistory(): Promise<
    ApiResponse<SpeedBoostHistoryItem[]>
  > {
    return serverApiClient.get<SpeedBoostHistoryItem[]>(
      "/api/customer/speed-requests/history",
    );
  }

  /**
   * Get the speed request currently awaiting a payment proof, if any.
   * Endpoint: GET /api/customer/speed-requests/awaiting-proof
   *
   * Returns data: null when there is nothing to upload for — the customer may
   * have no request, or an admin may have already verified it.
   */
  static async getRequestAwaitingProof(): Promise<
    ApiResponse<SpeedRequestAwaitingProof | null>
  > {
    return serverApiClient.get<SpeedRequestAwaitingProof | null>(
      "/api/customer/speed-requests/awaiting-proof",
    );
  }

  /**
   * Request speed boost
   * Endpoint: POST /api/request-speed
   *
   * Not under /api/customer — the backend mounts the submit endpoint on the
   * root router, unlike the other speed-request routes.
   *
   * @param data - Request data (targetPackageName, duration, paymentMethod?)
   */
  static async requestSpeedBoost(
    data: RequestSpeedBoostRequest,
  ): Promise<ApiResponse<RequestSpeedBoostResponse>> {
    return serverApiClient.post<RequestSpeedBoostResponse>(
      "/api/request-speed",
      data,
    );
  }

  /**
   * Cancel speed boost request
   * Endpoint: POST /api/customer/speed-requests/cancel
   *
   * @param requestId - Request ID to cancel
   */
  static async cancelSpeedBoostRequest(
    requestId: string,
  ): Promise<ApiResponse<{ message: string }>> {
    return serverApiClient.post<{ message: string }>(
      "/api/customer/speed-requests/cancel",
      { requestId },
    );
  }
}
