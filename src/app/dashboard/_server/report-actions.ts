"use server";

import { revalidatePath } from "next/cache";
import {
  isActiveReportStatus,
  toReportDisplayStatus,
} from "@/services/report.service";
import type { DashboardStatus, ReportHistoryItem } from "../types";
import { logPortalServerEvent } from "@/lib/server-log";

export async function getDashboardStatus(): Promise<DashboardStatus> {
  try {
    const { ReportService } = await import("@/services/report.service");
    const response = await ReportService.getDashboardStatus();

    if (!response.success || !response.data) {
      return { activeBoost: null, activeReport: null };
    }

    const data = response.data;
    const recentReports = Array.isArray(data.recentReports)
      ? data.recentReports
      : [];
    const firstActiveReport =
      recentReports.find((report) => isActiveReportStatus(report.status)) ||
      null;

    return {
      // The backend runs the record through formatSpeedRequest
      // (lib/speed-request-helper.js:163-192), which NESTS these: the raw
      // requestedPackageName/expirationDate never reach the wire. Reading the
      // pre-format names off the post-format object yielded undefined, so the
      // dashboard showed a blank package name and "Invalid Date".
      activeBoost: data.activeSpeedBoost
        ? {
            // formatSpeedRequest always builds both containers, but their
            // contents come from the stored record and can be blank.
            profile: data.activeSpeedBoost.requestedPackage.name || "-",
            expiresAt: data.activeSpeedBoost.timestamps.expires || "",
          }
        : null,
      activeReport: firstActiveReport
        ? {
            id: firstActiveReport.ticketId,
            category: firstActiveReport.issue_type,
            status: toReportDisplayStatus(firstActiveReport.status),
          }
        : null,
    };
  } catch (error) {
    logPortalServerEvent("error", "dashboard_status_fetch_error", {
      domain: "report",
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return { activeBoost: null, activeReport: null };
  }
}

export async function submitReport(
  formData: FormData,
): Promise<{ success: boolean; message: string; ticketId?: string }> {
  try {
    const status = await getDashboardStatus();
    if (status.activeReport) {
      return {
        success: false,
        message:
          "Anda sudah memiliki laporan aktif. Tunggu sampai laporan selesai sebelum membuat yang baru.",
      };
    }

    const category = formData.get("category") as string;
    const reportText = formData.get("description") as string;

    if (!category || !reportText) {
      return {
        success: false,
        message: "Kategori dan isi laporan harus diisi",
      };
    }

    const validCategories = [
      "MATI",
      "LEMOT",
      "PUTUS_NYAMBUNG",
      "WIFI",
      "HARDWARE",
      "GENERAL",
    ] as const;

    if (
      !validCategories.includes(category as (typeof validCategories)[number])
    ) {
      return {
        success: false,
        message: "Kategori tidak valid",
      };
    }

    const { ReportService } = await import("@/services/report.service");
    const response = await ReportService.submitReport({
      category: category as
        | "MATI"
        | "LEMOT"
        | "PUTUS_NYAMBUNG"
        | "WIFI"
        | "HARDWARE"
        | "GENERAL",
      reportText,
    });

    if (!response.success) {
      return {
        success: false,
        message: response.message || "Failed to submit report.",
      };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/history");
    const ticketId = response.data?.ticketId;
    return {
      message: ticketId
        ? `Report submitted successfully. Ticket ID: ${ticketId}`
        : "Report submitted successfully.",
      success: true,
      ticketId,
    };
  } catch (error) {
    logPortalServerEvent("error", "report_submit_error", {
      domain: "report",
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return { message: "Failed to submit report.", success: false };
  }
}

export async function uploadReportPhoto(
  ticketId: string,
  photoFile: File,
): Promise<{ success: boolean; message: string; data?: unknown }> {
  try {
    const { ReportService } = await import("@/services/report.service");
    const response = await ReportService.uploadPhoto(ticketId, photoFile);

    if (!response.success) {
      return {
        success: false,
        message: response.message || "Failed to upload photo.",
      };
    }

    return {
      success: true,
      message: response.message || "Photo uploaded successfully.",
      data: response.data,
    };
  } catch (error) {
    logPortalServerEvent("error", "report_photo_upload_error", {
      domain: "report",
      error: error instanceof Error ? error.message : "unknown_error",
      ticketId,
    });
    return { message: "Failed to upload photo.", success: false };
  }
}

export async function getReportHistory(): Promise<ReportHistoryItem[]> {
  try {
    const { ReportService } = await import("@/services/report.service");
    const response = await ReportService.getReportHistory();

    if (!response.success || !response.data) {
      return [];
    }

    return response.data.map((item) => ({
      id: item.ticketId,
      category: item.issue_type,
      status: toReportDisplayStatus(item.status),
      submittedAt: item.createdAt,
    }));
  } catch (error) {
    logPortalServerEvent("error", "report_history_fetch_error", {
      domain: "report",
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return [];
  }
}
