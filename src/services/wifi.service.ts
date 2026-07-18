/**
 * WiFi Service
 * Handles all WiFi-related API calls
 * Based on API_DOCUMENTATION_CUSTOMER_FRONTEND.md v2.0.0
 */

import { serverApiClient } from "@/lib/api-server";
import type { ApiResponse } from "@/types/api";

// New types based on API documentation
export interface WifiSSID {
  id: string;
  index: number;
  name: string;
  enabled: boolean;
  security: string;
  frequency: string;
  transmitPower?: string; // "100%" atau actual value, default: "100%"
}

export interface WifiInfoResponse {
  device_id: string;
  uptime: string; // "2 days" atau "Tidak Tersedia"
  lastInform: string | null; // ISO string atau null
  ssid: WifiSSID[];
  allowedSSIDs?: number[];
  totalSSIDs?: number;
}

export interface ConnectedDevice {
  mac_address: string;
  ip_address: string;
  host_name: string;
  signal_strength: number | null;
  signal_unit: string | null;
  connectedAt?: string;
  // Legacy fields for backward compatibility
  ip?: string;
  mac?: string;
  hostName?: string;
  signal?: string;
}

// Grouped Format
export interface ConnectedDevicesGroupedResponse {
  device_id: string;
  total_devices: number;
  format: "grouped";
  ssid_devices: Array<{
    ssid_index: number;
    ssid_id: string;
    ssid_name: string;
    device_count: number;
    devices: ConnectedDevice[];
  }>;
}

// Flat Format
export interface ConnectedDevicesFlatResponse {
  device_id: string;
  total_devices: number;
  format: "flat";
  devices: Array<
    ConnectedDevice & {
      ssid_index: number;
      ssid_id: string;
      ssid_name: string;
    }
  >;
}

// Union Type
export type ConnectedDevicesResponse =
  | ConnectedDevicesGroupedResponse
  | ConnectedDevicesFlatResponse;

export interface UpdateWifiNameRequest {
  ssidIndex: number;
  newName: string;
}

export interface UpdateWifiNameResponse {
  ssidIndex: number;
  oldName: string;
  newName: string;
  updatedAt: string;
}

export interface UpdateWifiPasswordRequest {
  ssidIndex: number;
  newPassword: string;
}

export interface UpdateWifiPasswordResponse {
  ssidIndex: number;
  updatedAt: string;
}

export interface UpdateWifiRequest {
  ssidIndex: number;
  newName?: string;
  newPassword?: string;
}

export interface UpdateWifiResponse {
  ssidIndex: number;
  updatedFields: string[];
  updatedAt: string;
}

export class WifiService {
  /**
   * Get WiFi info
   * Endpoint: GET /api/customer/wifi/info
   *
   * @param skipRefresh - Skip refresh dari GenieACS untuk performa lebih cepat (default: true)
   */
  static async getWifiInfo(
    skipRefresh: boolean = true,
  ): Promise<ApiResponse<WifiInfoResponse>> {
    const queryParams = new URLSearchParams({
      skipRefresh: skipRefresh.toString(),
    });
    return serverApiClient.get<WifiInfoResponse>(
      `/api/customer/wifi/info?${queryParams.toString()}`,
    );
  }

  /**
   * Get connected devices
   * Endpoint: GET /api/customer/wifi/connected-devices
   *
   * @param format - Format response: 'grouped' atau 'flat' (default: 'grouped')
   * @param skipRefresh - Skip refresh dari GenieACS untuk performa lebih cepat (default: true)
   */
  static async getConnectedDevices(
    format: "grouped" | "flat" = "grouped",
    skipRefresh: boolean = true,
  ): Promise<ApiResponse<ConnectedDevicesResponse>> {
    const queryParams = new URLSearchParams({
      format: format,
      skipRefresh: skipRefresh.toString(),
    });
    return serverApiClient.get<ConnectedDevicesResponse>(
      `/api/customer/wifi/connected-devices?${queryParams.toString()}`,
    );
  }

  /**
   * Update WiFi name
   * Endpoint: POST /api/customer/wifi/update-name
   *
   * @param ssidIndex - Index SSID (1-8)
   * @param newName - Nama WiFi baru (3-32 karakter)
   */
  static async updateWifiName(
    ssidIndex: number,
    newName: string,
  ): Promise<ApiResponse<UpdateWifiNameResponse>> {
    return serverApiClient.post<UpdateWifiNameResponse>(
      "/api/customer/wifi/update-name",
      { ssidIndex, newName },
    );
  }

  /**
   * Update WiFi password
   * Endpoint: POST /api/customer/wifi/update-password
   *
   * @param ssidIndex - Index SSID (1-8)
   * @param newPassword - Password WiFi baru (8-63 karakter)
   */
  static async updateWifiPassword(
    ssidIndex: number,
    newPassword: string,
  ): Promise<ApiResponse<UpdateWifiPasswordResponse>> {
    return serverApiClient.post<UpdateWifiPasswordResponse>(
      "/api/customer/wifi/update-password",
      { ssidIndex, newPassword },
    );
  }

  /**
   * Update WiFi (name and/or password)
   * Endpoint: PUT /api/customer/wifi/update
   *
   * @param data - Update data (minimal harus ada salah satu: newName atau newPassword)
   */
  static async updateWifi(
    data: UpdateWifiRequest,
  ): Promise<ApiResponse<UpdateWifiResponse>> {
    return serverApiClient.put<UpdateWifiResponse>(
      "/api/customer/wifi/update",
      data,
    );
  }

  /**
   * Reboot router
   * Endpoint: POST /api/customer/wifi/reboot
   *
   * Rate limit: 10 requests per 15 minutes
   */
  static async rebootRouter(): Promise<
    ApiResponse<{
      deviceId: string;
      message: string;
      rebootSent: boolean;
      timestamp: string;
    }>
  > {
    return serverApiClient.post<{
      deviceId: string;
      message: string;
      rebootSent: boolean;
      timestamp: string;
    }>("/api/customer/wifi/reboot", {});
  }
}
