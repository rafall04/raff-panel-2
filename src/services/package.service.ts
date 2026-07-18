/**
 * Package Service
 * Handles all package-related API calls
 */

import { serverApiClient } from "@/lib/api-server";
import type { ApiResponse } from "@/types/api";

// Monthly Package (for package change requests)
export interface MonthlyPackage {
  id: number | string;
  name: string;
  price: number; // Number format, perlu diformat untuk display
  profile: string; // Kecepatan internet (displayProfile atau profile)
  description: string; // Optional, bisa empty string
}

// Legacy Package interface (for backward compatibility)
export interface Package {
  name: string;
  price: string;
  profile: string;
}

export class PackageService {
  /**
   * Get available packages (legacy endpoint)
   */
  static async getAvailablePackages(): Promise<ApiResponse<Package[]>> {
    return serverApiClient.get<Package[]>("/api/packages");
  }

  /**
   * Get monthly packages (for package change requests)
   * Endpoint: GET /api/customer/packages
   *
   * Returns list of monthly packages with showInMonthly: true
   */
  static async getMonthlyPackages(): Promise<ApiResponse<MonthlyPackage[]>> {
    return serverApiClient.get<MonthlyPackage[]>("/api/customer/packages");
  }
}
