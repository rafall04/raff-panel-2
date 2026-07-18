import type { ReportDisplayStatus } from "@/services/report.service";

export interface AssociatedDevice {
  ip: string | null;
  mac: string | null;
  hostName: string | null;
  signal: string | null;
}

export interface SSID {
  id: string;
  name: string;
  transmitPower: string;
  associatedDevices: AssociatedDevice[];
}

export interface SSIDInfo {
  uptime: string | undefined;
  lastInform: string;
  ssid: SSID[];
}

export interface CustomerInfo {
  name: string | null;
  username: string | null;
  package: string;
  packageName: string;
  monthlyBill: number;
  monthlyBillFormatted: string;
  dueDate: string | null;
  dueDateFormatted: string | null;
  paymentStatus: "PAID" | "UNPAID" | null;
  address: string | null;
  phone_number: string | null;
  allowed_ssids: string[];
}

export interface ReportHistoryItem {
  id: string;
  category: string;
  status: ReportDisplayStatus;
  submittedAt: string;
}

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

export interface Package {
  name: string;
  price: string;
  profile: string;
}

interface WifiUpdateTarget {
  id: string;
  ssidIndex: number;
}

export interface WifiUpdateResult {
  id: string;
  ssidIndex: number;
  success: boolean;
  updatedFields: Array<"name" | "password">;
  message: string;
}

export interface WifiUpdateSummary {
  success: boolean;
  successCount: number;
  failureCount: number;
  results: WifiUpdateResult[];
  message: string;
}

export type { WifiUpdateTarget };
