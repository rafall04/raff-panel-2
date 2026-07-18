"use server";

import type { Package } from "../types";
import { logPortalServerEvent } from "@/lib/server-log";
import { getPublicBackendBaseUrl } from "@/lib/auth";

export async function getAvailablePackages(): Promise<Package[]> {
  try {
    const { PackageService } = await import("@/services/package.service");
    const response = await PackageService.getAvailablePackages();

    if (!response.success || !response.data) {
      logPortalServerEvent("warn", "available_packages_fetch_failed", {
        domain: "package",
        message: response.message || "missing_package_data",
      });
      return [];
    }

    return response.data;
  } catch (error) {
    logPortalServerEvent("error", "available_packages_fetch_error", {
      domain: "package",
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return [];
  }
}

export async function getMonthlyPackages(): Promise<
  Array<{
    id: number | string;
    name: string;
    price: number;
    profile: string;
    description: string;
  }>
> {
  try {
    const { PackageService } = await import("@/services/package.service");
    const response = await PackageService.getMonthlyPackages();

    if (!response.success || !response.data) {
      logPortalServerEvent("warn", "monthly_packages_fetch_failed", {
        domain: "package",
        message: response.message || "missing_monthly_packages",
      });
      return [];
    }

    return response.data;
  } catch (error) {
    logPortalServerEvent("error", "monthly_packages_fetch_error", {
      domain: "package",
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return [];
  }
}

export async function requestSpeedBoost(
  targetPackageName: string,
  duration: string,
  paymentMethod: "cash" | "transfer" | "double_billing" = "cash",
) {
  try {
    const { SpeedBoostService } =
      await import("@/services/speed-boost.service");
    const response = await SpeedBoostService.requestSpeedBoost({
      targetPackageName,
      duration: duration as "1_day" | "3_days" | "7_days",
      paymentMethod,
    });

    if (!response.success) {
      return {
        message: response.message || "Failed to request speed boost.",
        success: false,
      };
    }

    // needsPaymentProof dulu hanya mengubah teks toast lalu dibuang, padahal pelanggan memang
    // diminta mengunggah bukti. Surface-kan supaya pemanggil bisa menampilkan kontrol uploadnya —
    // endpoint bukti bayar mencari sendiri permintaan pending milik pelanggan, jadi requestId
    // tidak perlu ikut diteruskan.
    const needsPaymentProof = response.data?.needsPaymentProof === true;

    return {
      message: needsPaymentProof
        ? "Speed boost requested. Silakan upload bukti pembayaran."
        : "Speed boost requested successfully.",
      success: true,
      needsPaymentProof,
    };
  } catch (error) {
    logPortalServerEvent("error", "speed_boost_request_error", {
      domain: "speed_boost",
      error: error instanceof Error ? error.message : "unknown_error",
      targetPackageName,
      duration,
      paymentMethod,
    });
    return {
      message:
        error instanceof Error ? error.message : "An internal error occurred.",
      success: false,
    };
  }
}

export async function requestPackageChange(
  targetPackageName: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const { PackageChangeService } =
      await import("@/services/package-change.service");
    const response =
      await PackageChangeService.submitRequest(targetPackageName);

    if (!response.success) {
      return {
        message: response.message || "An unknown error occurred.",
        success: false,
      };
    }

    return {
      message: response.message || "Package change requested successfully.",
      success: true,
    };
  } catch (error) {
    logPortalServerEvent("error", "package_change_request_error", {
      domain: "package",
      error: error instanceof Error ? error.message : "unknown_error",
      targetPackageName,
    });
    return {
      message:
        error instanceof Error ? error.message : "An internal error occurred.",
      success: false,
    };
  }
}

export async function getCompanyName(): Promise<string> {
  try {
    const baseUrl = await getPublicBackendBaseUrl();

    const response = await fetch(`${baseUrl}/api/wifi-name`, {
      next: { revalidate: 3600 },
    });
    const data = (await response.json().catch(() => null)) as {
      data?: { wifiName?: string };
      wifiName?: string;
    } | null;
    return data?.data?.wifiName || data?.wifiName || "WiFi Portal";
  } catch (error) {
    logPortalServerEvent("warn", "company_name_fetch_failed", {
      domain: "settings",
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return "WiFi Portal";
  }
}
