import { serverApiClient } from "@/lib/api-server";
import type { ApiResponse } from "@/types/api";

export interface TrafficUsageStatus {
  enabled: boolean;
  usageEnabled: boolean;
  liveEnabled: boolean;
}

export interface TrafficUsageSummary {
  downloadBytes: number;
  uploadBytes: number;
  totalBytes: number;
}

export interface TrafficUsageDailyItem extends TrafficUsageSummary {
  date: string;
  lastCollectedAt: string | null;
}

export interface CustomerTrafficUsage {
  hasPppoe: boolean;
  pppoeUsername: string | null;
  today: TrafficUsageSummary;
  currentMonth: TrafficUsageSummary;
  dailyHistory: TrafficUsageDailyItem[];
  lastCollectedAt: string | null;
  stale: boolean;
}

export interface CustomerTrafficLive {
  hasPppoe: boolean;
  pppoeUsername: string | null;
  online: boolean;
  downloadBps: number;
  uploadBps: number;
  downloadHuman: string;
  uploadHuman: string;
  interfaceName: string | null;
  lastSampleAt: string | null;
  sampleIntervalMs: number | null;
  stale: boolean;
  warmup: boolean;
}

export class CustomerTrafficService {
  static async getTrafficUsageStatus(): Promise<
    ApiResponse<TrafficUsageStatus>
  > {
    return serverApiClient.get<TrafficUsageStatus>(
      "/api/customer/traffic-usage/status",
    );
  }

  static async getTrafficUsage(): Promise<ApiResponse<CustomerTrafficUsage>> {
    return serverApiClient.get<CustomerTrafficUsage>(
      "/api/customer/traffic-usage",
    );
  }

  static async getTrafficLive(): Promise<ApiResponse<CustomerTrafficLive>> {
    return serverApiClient.get<CustomerTrafficLive>(
      "/api/customer/traffic-live",
    );
  }
}
