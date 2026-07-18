"use server";

import { revalidatePath } from "next/cache";
import type {
  AssociatedDevice,
  CustomerInfo,
  SSID,
  SSIDInfo,
  WifiUpdateResult,
  WifiUpdateSummary,
  WifiUpdateTarget,
} from "../types";
import { logPortalServerEvent } from "@/lib/server-log";
import { getCustomerProfile } from "./customer-profile";

async function rebootRouter() {
  try {
    const { WifiService } = await import("@/services/wifi.service");
    const response = await WifiService.rebootRouter();

    if (!response.success) {
      throw new Error(response.message || "Failed to reboot router");
    }

    return {
      message: response.data?.message || "ok",
    };
  } catch (error) {
    logPortalServerEvent("error", "wifi_reboot_error", {
      domain: "wifi",
      error: error instanceof Error ? error.message : "unknown_error",
    });
    throw error instanceof Error ? error : new Error("Failed to reboot router");
  }
}

async function refreshObject() {
  try {
    const { WifiService } = await import("@/services/wifi.service");
    const response = await WifiService.getWifiInfo(false);

    if (!response.success) {
      throw new Error(response.message || "Failed to refresh WiFi data");
    }

    return {
      message: "ok",
    };
  } catch (error) {
    logPortalServerEvent("error", "wifi_refresh_error", {
      domain: "wifi",
      error: error instanceof Error ? error.message : "unknown_error",
    });
    throw error instanceof Error
      ? error
      : new Error("Failed to refresh WiFi data");
  }
}

function resolveAllowedSsidIds(customerInfo: CustomerInfo | null): string[] {
  if (
    customerInfo?.allowed_ssids &&
    Array.isArray(customerInfo.allowed_ssids) &&
    customerInfo.allowed_ssids.length > 0
  ) {
    return customerInfo.allowed_ssids;
  }

  logPortalServerEvent("warn", "wifi_allowed_ssids_missing", {
    domain: "wifi",
  });
  return [];
}

async function getSSIDInfo(allowedSsids: string[]): Promise<SSIDInfo | null> {
  try {
    const { WifiService } = await import("@/services/wifi.service");

    // Independent calls — run them together so the page waits for the slower
    // one rather than the sum of both.
    const [wifiInfoResponse, connectedDevicesResponse] = await Promise.all([
      WifiService.getWifiInfo(true),
      WifiService.getConnectedDevices("grouped", true),
    ]);

    if (!wifiInfoResponse.success || !wifiInfoResponse.data) {
      logPortalServerEvent("warn", "wifi_info_missing", {
        domain: "wifi",
        message: wifiInfoResponse.message || "missing_wifi_info",
      });
      return null;
    }

    const wifiInfo = wifiInfoResponse.data;

    const ssidDevicesMap = new Map<number, AssociatedDevice[]>();

    if (connectedDevicesResponse.success && connectedDevicesResponse.data) {
      const connectedDevicesData = connectedDevicesResponse.data;

      if (
        connectedDevicesData.format === "grouped" &&
        "ssid_devices" in connectedDevicesData
      ) {
        connectedDevicesData.ssid_devices.forEach((ssidGroup) => {
          const devices = ssidGroup.devices.map((device) => ({
            ip: device.ip_address || device.ip || null,
            mac: device.mac_address || device.mac || null,
            hostName: device.host_name || device.hostName || null,
            signal:
              device.signal_strength !== null
                ? `${device.signal_strength} ${device.signal_unit || "dBm"}`
                : device.signal || null,
          }));
          ssidDevicesMap.set(ssidGroup.ssid_index, devices);
        });
      } else if ("devices" in connectedDevicesData) {
        const devicesBySSID = new Map<number, AssociatedDevice[]>();
        connectedDevicesData.devices.forEach((device) => {
          const ssidIndex = device.ssid_index;
          if (!devicesBySSID.has(ssidIndex)) {
            devicesBySSID.set(ssidIndex, []);
          }
          const items = devicesBySSID.get(ssidIndex);
          if (items) {
            items.push({
              ip: device.ip_address || device.ip || null,
              mac: device.mac_address || device.mac || null,
              hostName: device.host_name || device.hostName || null,
              signal:
                device.signal_strength !== null
                  ? `${device.signal_strength} ${device.signal_unit || "dBm"}`
                  : device.signal || null,
            });
          }
        });
        devicesBySSID.forEach((devices, ssidIndex) => {
          ssidDevicesMap.set(ssidIndex, devices);
        });
      }
    }

    const ssid: SSID[] = wifiInfo.ssid
      .filter((ssidItem) => allowedSsids.includes(ssidItem.id))
      .map((ssidItem) => ({
        id: ssidItem.id,
        name: ssidItem.name,
        transmitPower: ssidItem.transmitPower || "100%",
        associatedDevices: ssidDevicesMap.get(ssidItem.index) || [],
      }));

    return {
      lastInform: wifiInfo.lastInform || "Not Available",
      uptime:
        wifiInfo.uptime === "Tidak Tersedia" ? undefined : wifiInfo.uptime,
      ssid,
    };
  } catch (error) {
    logPortalServerEvent("error", "wifi_page_data_error", {
      domain: "wifi",
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return null;
  }
}

function toWifiUpdateTarget(
  id: string,
  allowedSsids: string[],
): WifiUpdateTarget {
  if (allowedSsids.length === 0) {
    throw new Error("Allowed SSIDs are not configured for this customer");
  }

  if (!allowedSsids.includes(id)) {
    throw new Error("SSID is not allowed for this customer");
  }

  const ssidIndex = Number.parseInt(id, 10);
  if (Number.isNaN(ssidIndex) || ssidIndex < 1 || ssidIndex > 8) {
    throw new Error(`Invalid SSID index: ${id}`);
  }

  return { id, ssidIndex };
}

async function getWifiTargets(ssidIds: string[]): Promise<WifiUpdateTarget[]> {
  const customerInfo = await getCustomerProfile();
  const allowedSsids = resolveAllowedSsidIds(customerInfo);
  return ssidIds.map((id) => toWifiUpdateTarget(id, allowedSsids));
}

async function updateWifiTarget(
  target: WifiUpdateTarget,
  payload: { newName?: string; newPassword?: string },
): Promise<WifiUpdateResult> {
  const { WifiService } = await import("@/services/wifi.service");
  const response = await WifiService.updateWifi({
    ssidIndex: target.ssidIndex,
    ...payload,
  });

  if (!response.success) {
    return {
      id: target.id,
      ssidIndex: target.ssidIndex,
      success: false,
      updatedFields: [],
      message: response.message || "Failed to update WiFi settings",
    };
  }

  const updatedFields: Array<"name" | "password"> = [];
  if (payload.newName) {
    updatedFields.push("name");
  }
  if (payload.newPassword) {
    updatedFields.push("password");
  }

  return {
    id: target.id,
    ssidIndex: target.ssidIndex,
    success: true,
    updatedFields,
    message: response.message || "WiFi settings updated",
  };
}

export async function getWifiPageData(): Promise<SSIDInfo | null> {
  const customerInfo = await getCustomerProfile();
  const allowedSsids = resolveAllowedSsidIds(customerInfo);
  if (allowedSsids.length === 0) {
    return null;
  }

  return getSSIDInfo(allowedSsids);
}

export async function updateWifiSettings(input: {
  ssidIds: string[];
  newName?: string;
  newPassword?: string;
}): Promise<WifiUpdateSummary> {
  try {
    const sanitizedName = input.newName?.trim();
    const sanitizedPassword = input.newPassword?.trim();

    if (!sanitizedName && !sanitizedPassword) {
      return {
        success: false,
        successCount: 0,
        failureCount: 0,
        results: [],
        message: "No changes to save.",
      };
    }

    const targets = await getWifiTargets(input.ssidIds);
    const results: WifiUpdateResult[] = [];

    for (const target of targets) {
      try {
        results.push(
          await updateWifiTarget(target, {
            newName: sanitizedName || undefined,
            newPassword: sanitizedPassword || undefined,
          }),
        );
      } catch (error) {
        results.push({
          id: target.id,
          ssidIndex: target.ssidIndex,
          success: false,
          updatedFields: [],
          message:
            error instanceof Error
              ? error.message
              : "Failed to update WiFi settings",
        });
      }
    }

    const successCount = results.filter((result) => result.success).length;
    const failureCount = results.length - successCount;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/wifi");

    if (successCount === results.length) {
      return {
        success: true,
        successCount,
        failureCount,
        results,
        message:
          results.length > 1
            ? "WiFi settings updated for all selected SSIDs."
            : "WiFi settings updated successfully.",
      };
    }

    if (successCount > 0) {
      return {
        success: false,
        successCount,
        failureCount,
        results,
        message: `WiFi settings updated for ${successCount} SSID(s), but ${failureCount} failed.`,
      };
    }

    return {
      success: false,
      successCount,
      failureCount,
      results,
      message: "Failed to update WiFi settings.",
    };
  } catch (error) {
    logPortalServerEvent("error", "wifi_update_error", {
      domain: "wifi",
      error: error instanceof Error ? error.message : "unknown_error",
      ssidCount: input.ssidIds.length,
    });
    return {
      success: false,
      successCount: 0,
      failureCount: input.ssidIds.length,
      results: [],
      message:
        error instanceof Error
          ? error.message
          : "Failed to update WiFi settings.",
    };
  }
}

export { rebootRouter, refreshObject };
