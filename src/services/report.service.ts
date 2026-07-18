/**
 * Report Service
 * Handles all report-related API calls
 * Based on API_DOCUMENTATION_CUSTOMER_FRONTEND.md v2.0.0
 */

import { serverApiClient } from "@/lib/api-server";
import { getBackendAccessToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export type BackendReportStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "resolved";

export type ReportDisplayStatus =
  | "Submitted"
  | "In Progress"
  | "Completed"
  | "Cancelled";

// Report Category Types (from Phase 1 documentation)
export type ReportCategory =
  | "MATI"
  | "LEMOT"
  | "PUTUS_NYAMBUNG"
  | "WIFI"
  | "HARDWARE"
  | "GENERAL";

// Submit Report Request (from Phase 1 documentation)
export interface SubmitReportRequest {
  category: ReportCategory;
  reportText: string;
}

// Submit Report Response (from Phase 1 documentation)
export interface SubmitReportResponse {
  ticketId: string;
}

// Upload Photo Response (from Phase 2 documentation)
export interface UploadPhotoResponse {
  ticketId: string;
  photoCount: number;
  totalPhotos: number;
  maxPhotos: number;
  photo: {
    fileName: string;
    uploadedAt: string;
    size: number;
  };
}

// Report History Item (backend format from API)
export interface ReportHistoryItem {
  ticketId: string;
  issue_type: string;
  status: BackendReportStatus;
  createdAt: string;
}

// Report History Response Item (frontend format from Phase 3 documentation)
export interface ReportHistoryResponseItem {
  id: string;
  category: string;
  status: ReportDisplayStatus;
  submittedAt: string;
}

// Dashboard Status Response (from documentation)
export interface DashboardStatusResponse {
  profile: {
    name: string;
    subscription: string;
    paid: boolean;
  };
  /**
   * Shape produced by the backend's formatSpeedRequest
   * (raf-bot-v2 lib/speed-request-helper.js:163-192) — NOT the raw stored
   * record. This type previously described the raw record, which let TypeScript
   * bless reads of fields that never arrive over the wire.
   */
  activeSpeedBoost: {
    id: string;
    requestedPackage: { name: string; price?: number; profile?: string };
    duration: { key?: string; label?: string; hours?: number };
    boostPrice: number;
    status: string;
    timestamps: { created: string; updated: string; expires: string };
  } | null;
  pendingReports: number;
  recentReports?: ReportHistoryItem[]; // Optional - backend might not return this field
}

// Legacy DashboardStatus (for backward compatibility)
export interface DashboardStatus {
  activeBoost: {
    profile: string;
    expiresAt: string;
  } | null;
  activeReport: {
    id: string;
    category: string;
    status: ReportDisplayStatus;
  } | null;
}

export function normalizeReportStatus(
  status: string,
): Exclude<BackendReportStatus, "resolved"> | "unknown" {
  switch (status) {
    case "pending":
      return "pending";
    case "in_progress":
      return "in_progress";
    case "completed":
    case "resolved":
      return "completed";
    case "cancelled":
    case "dibatalkan admin":
    case "dibatalkan pelanggan":
      return "cancelled";
    default:
      return "unknown";
  }
}

export function isActiveReportStatus(status: string): boolean {
  const normalizedStatus = normalizeReportStatus(status);
  return normalizedStatus === "pending" || normalizedStatus === "in_progress";
}

export function toReportDisplayStatus(status: string): ReportDisplayStatus {
  switch (normalizeReportStatus(status)) {
    case "pending":
      return "Submitted";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Submitted";
  }
}

export class ReportService {
  /**
   * Submit a report
   * Endpoint: POST /api/lapor
   * Phase 1: Submit report endpoint dengan kategori dan deskripsi
   *
   * @param data - Report data (category, reportText)
   */
  static async submitReport(
    data: SubmitReportRequest,
  ): Promise<ApiResponse<SubmitReportResponse>> {
    return serverApiClient.post<SubmitReportResponse>("/api/lapor", data);
  }

  /**
   * Get report history
   * Endpoint: GET /api/customer/reports/history
   */
  static async getReportHistory(): Promise<ApiResponse<ReportHistoryItem[]>> {
    return serverApiClient.get<ReportHistoryItem[]>(
      "/api/customer/reports/history",
    );
  }

  /**
   * Get dashboard status
   * Endpoint: GET /api/dashboard-status
   *
   * Returns complete dashboard status including profile, active speed boost, and reports
   */
  static async getDashboardStatus(): Promise<
    ApiResponse<DashboardStatusResponse>
  > {
    return serverApiClient.get<DashboardStatusResponse>(
      "/api/dashboard-status",
    );
  }

  /**
   * Upload photo for a report
   * Endpoint: POST /api/customer/reports/upload-photo
   *
   * Server-only. Bypasses serverApiClient because that client forces
   * Content-Type: application/json, which would corrupt the multipart boundary.
   *
   * @param ticketId - Ticket ID from submit report
   * @param photoFile - Photo file to upload
   */
  static async uploadPhoto(
    ticketId: string,
    photoFile: File,
  ): Promise<ApiResponse<UploadPhotoResponse>> {
    if (!ticketId) {
      return { success: false, message: "Ticket ID is required" };
    }

    if (photoFile.size > MAX_PHOTO_SIZE_BYTES) {
      return { success: false, message: "Ukuran file maksimal 5MB" };
    }

    if (!ALLOWED_PHOTO_TYPES.includes(photoFile.type)) {
      return {
        success: false,
        message: "Hanya file gambar yang diperbolehkan (JPEG, PNG, GIF, WebP)",
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
    formData.append("ticketId", ticketId);
    formData.append("photo", photoFile);

    const response = await fetch(
      `${apiUrl}/api/customer/reports/upload-photo`,
      {
        method: "POST",
        // Content-Type is intentionally omitted: fetch derives the multipart boundary.
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        cache: "no-store",
      },
    );

    const json = (await response.json().catch(() => null)) as {
      message?: string;
      data?: UploadPhotoResponse;
    } | null;

    if (!response.ok) {
      return {
        success: false,
        message: json?.message || "Failed to upload photo",
      };
    }

    return {
      success: true,
      data: json?.data,
      message: json?.message,
    };
  }
}
