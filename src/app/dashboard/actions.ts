"use server";

export type {
  AssociatedDevice,
  SSID,
  SSIDInfo,
  CustomerInfo,
  ReportHistoryItem,
  DashboardStatus,
  CustomerTrafficUsage,
  CustomerTrafficLive,
  Package,
  WifiUpdateResult,
  WifiUpdateSummary,
} from "./types";

import { getCustomerInfo as getCustomerInfoImpl } from "./_server/customer-actions";
import {
  getAvailablePackages as getAvailablePackagesImpl,
  getMonthlyPackages as getMonthlyPackagesImpl,
  requestSpeedBoost as requestSpeedBoostImpl,
  requestPackageChange as requestPackageChangeImpl,
  getCompanyName as getCompanyNameImpl,
} from "./_server/package-actions";
import {
  getDashboardStatus as getDashboardStatusImpl,
  submitReport as submitReportImpl,
  uploadReportPhoto as uploadReportPhotoImpl,
  getReportHistory as getReportHistoryImpl,
} from "./_server/report-actions";
import {
  getWifiPageData as getWifiPageDataImpl,
  updateWifiSettings as updateWifiSettingsImpl,
  rebootRouter as rebootRouterImpl,
  refreshObject as refreshObjectImpl,
} from "./_server/wifi-actions";
import { getDashboardPageData as getDashboardPageDataImpl } from "./_server/dashboard-data";
import {
  uploadPaymentProof as uploadPaymentProofImpl,
  getSpeedRequestAwaitingProof as getSpeedRequestAwaitingProofImpl,
} from "./_server/payment-proof-actions";
import {
  getVoucherPageData as getVoucherPageDataImpl,
  createVoucherPurchase as createVoucherPurchaseImpl,
  getVoucherPurchaseStatus as getVoucherPurchaseStatusImpl,
  getVoucherHistory as getVoucherHistoryImpl,
} from "./_server/voucher-actions";
import type { PaymentProofType } from "@/services/payment-proof.service";
import { CustomerTrafficService } from "@/services/customer-traffic.service";
import { updateCredentials as updateCredentialsImpl } from "@/utils/auth.server";

export async function getCustomerInfo() {
  return getCustomerInfoImpl();
}

export async function getAvailablePackages() {
  return getAvailablePackagesImpl();
}

export async function getMonthlyPackages() {
  return getMonthlyPackagesImpl();
}

export async function requestSpeedBoost(
  targetPackageName: string,
  duration: string,
  paymentMethod: "cash" | "transfer" | "double_billing" = "cash",
) {
  return requestSpeedBoostImpl(targetPackageName, duration, paymentMethod);
}

export async function requestPackageChange(targetPackageName: string) {
  return requestPackageChangeImpl(targetPackageName);
}

export async function getCompanyName() {
  return getCompanyNameImpl();
}

export async function getDashboardStatus() {
  return getDashboardStatusImpl();
}

export async function submitReport(formData: FormData) {
  return submitReportImpl(formData);
}

export async function uploadReportPhoto(ticketId: string, file: File) {
  return uploadReportPhotoImpl(ticketId, file);
}

export async function getReportHistory() {
  return getReportHistoryImpl();
}

export async function getWifiPageData() {
  return getWifiPageDataImpl();
}

export async function updateWifiSettings(payload: {
  ssidIds: string[];
  newName?: string;
  newPassword?: string;
}) {
  return updateWifiSettingsImpl(payload);
}

export async function rebootRouter() {
  return rebootRouterImpl();
}

export async function refreshObject() {
  return refreshObjectImpl();
}

export async function getDashboardPageData() {
  return getDashboardPageDataImpl();
}

export async function uploadPaymentProof(
  type: PaymentProofType,
  file: File,
  caption: string = "",
) {
  return uploadPaymentProofImpl(type, file, caption);
}

export async function getSpeedRequestAwaitingProof() {
  return getSpeedRequestAwaitingProofImpl();
}

export async function getCustomerTrafficUsage() {
  const response = await CustomerTrafficService.getTrafficUsage();
  if (!response.success || !response.data) {
    throw new Error(response.message || "Failed to fetch traffic usage");
  }
  return response.data;
}

export async function getCustomerTrafficUsageStatus() {
  return CustomerTrafficService.getTrafficUsageStatus();
}

export async function getCustomerTrafficLive() {
  const response = await CustomerTrafficService.getTrafficLive();
  if (!response.success || !response.data) {
    throw new Error(response.message || "Failed to fetch live traffic");
  }
  return response.data;
}

export async function updateCredentials(
  currentPassword: string,
  newUsername?: string,
  newPassword?: string,
) {
  return updateCredentialsImpl(currentPassword, newUsername, newPassword);
}

export async function getVoucherPageData() {
  return getVoucherPageDataImpl();
}

export async function createVoucherPurchase(prof: string) {
  return createVoucherPurchaseImpl(prof);
}

export async function getVoucherPurchaseStatus(reff: string) {
  return getVoucherPurchaseStatusImpl(reff);
}

export async function getVoucherHistory() {
  return getVoucherHistoryImpl();
}
