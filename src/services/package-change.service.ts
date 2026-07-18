/**
 * Package Change Request Service
 * Handles all package change request-related API calls
 * Based on API documentation v1.0.0
 */

import { serverApiClient } from "@/lib/api-server";
import type { ApiResponse } from "@/types/api";

export interface PackageChangeRequest {
  id: string;
  currentPackageName: string;
  currentPackagePrice: number;
  requestedPackageName: string;
  requestedPackagePrice: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  updatedAt: string | null;
  approvedBy: string | null;
  notes: string | null;
}

export interface PackageChangeHistoryResponse {
  status: number;
  message: string;
  data: PackageChangeRequest[];
}

export interface SubmitPackageChangeRequest {
  targetPackageName: string;
}

export interface SubmitPackageChangeResponse {
  status: number;
  message: string;
  data: null;
}

export class PackageChangeService {
  /**
   * Get package change request history
   * Endpoint: GET /api/customer/package-change-requests/history
   *
   * Returns all package change requests for the authenticated customer
   */
  static async getHistory(): Promise<ApiResponse<PackageChangeRequest[]>> {
    return serverApiClient.get<PackageChangeRequest[]>(
      "/api/customer/package-change-requests/history",
    );
  }

  /**
   * Submit a new package change request
   * Endpoint: POST /api/customer/request-package-change
   *
   * @param targetPackageName - Name of the target package to request
   */
  static async submitRequest(
    targetPackageName: string,
  ): Promise<ApiResponse<null>> {
    const payload: SubmitPackageChangeRequest = {
      targetPackageName,
    };

    return serverApiClient.post<null>(
      "/api/customer/request-package-change",
      payload,
    );
  }
}
