/**
 * Phone Number Service
 * Handles all phone number management API calls
 * Based on API_DOCUMENTATION_CUSTOMER_FRONTEND.md v2.0.0
 */

import { serverApiClient } from "@/lib/api-server";
import type { ApiResponse } from "@/types/api";

// Get Phone Numbers Response
export interface PhoneNumbersResponse {
  phone_numbers: string[];
  max_allowed: number;
  current_count: number;
  can_add_more: boolean;
}

// Add Phone Number Request
export interface AddPhoneNumberRequest {
  phoneNumber: string;
}

// Add Phone Number Response
export interface AddPhoneNumberResponse {
  phone_numbers: string[];
  max_allowed: number;
  current_count: number;
}

// Remove Phone Number Response
export interface RemovePhoneNumberResponse {
  phone_numbers: string[];
  current_count: number;
}

export class PhoneService {
  /**
   * Get phone numbers
   * Endpoint: GET /api/customer/phone-numbers
   *
   * Returns list of phone numbers registered to the customer account
   */
  static async getPhoneNumbers(): Promise<ApiResponse<PhoneNumbersResponse>> {
    return serverApiClient.get<PhoneNumbersResponse>(
      "/api/customer/phone-numbers",
    );
  }

  /**
   * Add phone number
   * Endpoint: POST /api/customer/phone-numbers/add
   *
   * @param phoneNumber - Phone number to add (format: 08xxxxxxxxx, 628xxxxxxxxx, or +628xxxxxxxxx)
   *                       Will be normalized to 62xxxxxxxxxxx format by backend
   */
  static async addPhoneNumber(
    phoneNumber: string,
  ): Promise<ApiResponse<AddPhoneNumberResponse>> {
    return serverApiClient.post<AddPhoneNumberResponse>(
      "/api/customer/phone-numbers/add",
      { phoneNumber },
    );
  }

  /**
   * Remove phone number
   * Endpoint: DELETE /api/customer/phone-numbers/:phoneNumber
   *
   * @param phoneNumber - Phone number to remove (URL-encoded automatically)
   *
   * Note: Minimum 1 phone number must always exist in the account
   */
  static async removePhoneNumber(
    phoneNumber: string,
  ): Promise<ApiResponse<RemovePhoneNumberResponse>> {
    // URL encode phone number for DELETE request
    const encodedPhone = encodeURIComponent(phoneNumber);
    return serverApiClient.delete<RemovePhoneNumberResponse>(
      `/api/customer/phone-numbers/${encodedPhone}`,
    );
  }
}
