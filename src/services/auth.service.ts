/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { serverApiClient } from "@/lib/api-server";
import type { ApiResponse } from "@/types/api";

export interface OtpRequestResponse {
  message: string;
}

export interface OtpVerifyResponse {
  user: {
    id: number;
    name: string;
    // deviceId tidak diperlukan - backend sudah handle semua WiFi operations
  };
  token: string;
}

export interface LoginResponse {
  user: {
    id: number;
    name: string;
    // deviceId tidak diperlukan - backend sudah handle semua WiFi operations
  };
  token: string;
}

export interface UpdateCredentialsRequest {
  currentPassword: string;
  newUsername?: string;
  newPassword?: string;
}

export interface UpdateCredentialsResponse {
  updatedFields: string[];
}

export class AuthService {
  /**
   * Request OTP
   */
  static async requestOtp(
    phoneNumber: string,
  ): Promise<ApiResponse<OtpRequestResponse>> {
    return serverApiClient.post<OtpRequestResponse>(
      "/api/auth/otp/request",
      { phoneNumber },
      { requireAuth: false },
    );
  }

  /**
   * Verify OTP
   */
  static async verifyOtp(
    phoneNumber: string,
    otp: string,
  ): Promise<ApiResponse<OtpVerifyResponse>> {
    return serverApiClient.post<OtpVerifyResponse>(
      "/api/auth/otp/verify",
      { phoneNumber, otp },
      { requireAuth: false },
    );
  }

  /**
   * Login with username and password
   */
  static async login(
    username: string,
    password: string,
  ): Promise<ApiResponse<LoginResponse>> {
    return serverApiClient.post<LoginResponse>(
      "/api/auth/login",
      { username, password },
      { requireAuth: false },
    );
  }

  /**
   * Update credentials (username/password)
   * Endpoint: POST /api/customer/account/update
   *
   * @param data - Update data (currentPassword is required, newUsername or newPassword is required)
   *
   * Note: At least one of newUsername or newPassword must be provided
   */
  static async updateCredentials(
    data: UpdateCredentialsRequest,
  ): Promise<ApiResponse<UpdateCredentialsResponse>> {
    return serverApiClient.post<UpdateCredentialsResponse>(
      "/api/customer/account/update",
      data,
    );
  }
}
