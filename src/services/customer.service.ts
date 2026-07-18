/**
 * Customer Service
 * Handles all customer-related API calls
 * Based on API_DOCUMENTATION_CUSTOMER_FRONTEND.md v2.0.0
 */

import { serverApiClient } from "@/lib/api-server";
import type { ApiResponse } from "@/types/api";

export interface CustomerInfo {
  name: string | null;
  username: string | null;
  package: string; // Alias untuk packageName, gunakan ini untuk display
  packageName: string; // Original field
  monthlyBill: number; // JANGAN gunakan untuk display, gunakan monthlyBillFormatted
  monthlyBillFormatted: string; // Gunakan ini untuk display (contoh: "Rp 100.000")
  dueDate: string | null; // JANGAN gunakan untuk display, gunakan dueDateFormatted (ISO 8601)
  dueDateFormatted: string | null; // Gunakan ini untuk display (contoh: "10 Desember 2025")
  paymentStatus: "PAID" | "UNPAID" | null;
  address: string | null;
  phone_number: string | null;
  allowed_ssids: string[];
}

export class CustomerService {
  /**
   * Get customer profile
   * Endpoint: GET /api/customer/profile
   *
   * Returns complete customer profile information
   */
  static async getProfile(): Promise<ApiResponse<CustomerInfo>> {
    return serverApiClient.get<CustomerInfo>("/api/customer/profile");
  }

  /**
   * Update customer profile
   * Note: This endpoint may not be available in the API documentation
   * Keeping for backward compatibility
   */
  static async updateProfile(
    data: Partial<CustomerInfo>,
  ): Promise<ApiResponse<CustomerInfo>> {
    return serverApiClient.patch<CustomerInfo>("/api/customer/profile", data);
  }
}
