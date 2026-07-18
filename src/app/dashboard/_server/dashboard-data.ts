"use server";

import type { CustomerInfo, DashboardStatus, SSIDInfo } from "../types";
import { getCustomerProfile } from "./customer-profile";
import { getDashboardStatus } from "./report-actions";
import { getWifiPageData } from "./wifi-actions";
import { CustomerTrafficService } from "@/services/customer-traffic.service";

export async function getDashboardPageData(): Promise<{
  ssidInfo: SSIDInfo | null;
  customerInfo: CustomerInfo | null;
  dashboardStatus: DashboardStatus;
  trafficUsage: import("../types").CustomerTrafficUsage | null;
  trafficUsageEnabled: boolean;
  trafficLiveEnabled: boolean;
}> {
  try {
    // getWifiPageData needs the profile too, but getCustomerProfile is
    // React.cache'd, so both resolve from a single request rather than the
    // profile gating the rest of the page.
    const [customerInfo, ssidInfo, dashboardStatus, trafficStatus] =
      await Promise.all([
        getCustomerProfile(),
        getWifiPageData(),
        getDashboardStatus(),
        CustomerTrafficService.getTrafficUsageStatus().catch(() => ({
          success: false,
          data: { enabled: false, usageEnabled: false, liveEnabled: false },
        })),
      ]);

    const trafficUsageEnabled =
      trafficStatus.success &&
      (trafficStatus.data?.usageEnabled === true ||
        trafficStatus.data?.enabled === true);
    const trafficLiveEnabled =
      trafficStatus.success && trafficStatus.data?.liveEnabled === true;
    const trafficUsage = trafficUsageEnabled
      ? (
          await CustomerTrafficService.getTrafficUsage().catch(() => ({
            success: false,
            data: null,
          }))
        ).data || null
      : null;

    return {
      ssidInfo,
      customerInfo,
      dashboardStatus,
      trafficUsage,
      trafficUsageEnabled,
      trafficLiveEnabled,
    };
  } catch {
    return {
      ssidInfo: null,
      customerInfo: null,
      dashboardStatus: { activeBoost: null, activeReport: null },
      trafficUsage: null,
      trafficUsageEnabled: false,
      trafficLiveEnabled: false,
    };
  }
}
