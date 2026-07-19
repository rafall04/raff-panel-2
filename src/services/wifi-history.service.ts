/**
 * WiFi Change History Service — log of the customer's WiFi name/password changes.
 * Backed by GET /api/customer/wifi/change-history.
 *
 * SECURITY: the backend never returns the actual WiFi password value — only that
 * a password change happened. Do not attempt to surface a password here.
 */

import { serverApiClient } from "@/lib/api-server";
import type { ApiResponse } from "@/types/api";

export interface WifiChangeItem {
  id: string;
  timestamp: string;
  /** "ssid_name" | "password" | "both" | "transmit_power" (open string). */
  type: string;
  typeLabel: string;
  description: string;
  source: string;
  sourceLabel: string;
}

export class WifiHistoryService {
  /**
   * WiFi change history for the authenticated customer, newest first.
   * Endpoint: GET /api/customer/wifi/change-history
   */
  static async getChangeHistory(): Promise<ApiResponse<WifiChangeItem[]>> {
    return serverApiClient.get<WifiChangeItem[]>(
      "/api/customer/wifi/change-history",
    );
  }
}
