"use client";

import { useState, useEffect } from "react";
import type {
  SSIDInfo,
  CustomerInfo,
  DashboardStatus,
  CustomerTrafficUsage,
} from "./actions";
import { getWifiPageData, refreshObject } from "./actions";

import CustomerView from "./customer.view";
import StatusView from "./status.view";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import AssociatedDevicesTable from "./associated-devices-table";
import AnnouncementDisplay from "./announcement-display";
import NewsDisplay from "./news-display";
import { useSpeedOnDemand } from "./speed-on-demand-context";
import CustomerTrafficLiveCard from "@/components/customer-traffic-live-card";

export default function View({
  ssidInfo: initialSsidInfo,
  customerInfo,
  dashboardStatus,
  trafficUsage,
  trafficUsageEnabled,
  trafficLiveEnabled,
}: {
  ssidInfo: SSIDInfo;
  customerInfo: CustomerInfo | null;
  dashboardStatus: DashboardStatus;
  trafficUsage: CustomerTrafficUsage | null;
  trafficUsageEnabled: boolean;
  trafficLiveEnabled: boolean;
}) {
  const [ssidInfo, setSSIDInfo] = useState<SSIDInfo>(initialSsidInfo);
  const [loading, setLoading] = useState<boolean>(false);
  const { isEnabled: isSpeedOnDemandEnabled } = useSpeedOnDemand();

  // Effect for real-time data refresh
  useEffect(() => {
    const intervalId = setInterval(() => {
      // refreshSsidInfo triggers a real TR-069 poll of the customer's router,
      // so never let it fire for a tab nobody is looking at.
      if (document.visibilityState !== "visible") {
        return;
      }
      if (!loading) {
        void refreshSsidInfo();
      }
    }, 300000); // Refresh every 5 minutes

    return () => clearInterval(intervalId);
  }, [loading]);

  const refreshSsidInfo = async () => {
    setLoading(true);
    toast.info("Refreshing data...");
    try {
      await refreshObject();
      const newSsidInfo = await getWifiPageData();
      if (newSsidInfo) {
        setSSIDInfo(newSsidInfo);
        toast.success("Data refreshed successfully!");
        return;
      }

      toast.error("Data perangkat tidak tersedia saat ini.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to refresh data.",
      );
    } finally {
      setLoading(false);
    }
  };

  const isOnline =
    new Date(ssidInfo.lastInform).getTime() > new Date().getTime() - 86700000;
  const allDevices = ssidInfo.ssid.flatMap((s) => s.associatedDevices);
  const formatBytes = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) {
      return "0 B";
    }
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = value;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex += 1;
    }
    return `${size.toFixed(size >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  };

  return (
    <div className="space-y-6">
      <AnnouncementDisplay />
      {/* Top Row: Main Status and Customer Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Network Status</CardTitle>
              <CardDescription>
                Hello, {customerInfo?.name || "Customer"}!
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void refreshSsidInfo();
              }}
              disabled={loading}
            >
              <RefreshCw
                size={14}
                className={`mr-2 ${loading ? "animate-spin" : ""}`}
              />{" "}
              Refresh
            </Button>
          </CardHeader>
          <CardContent
            className={`grid gap-4 text-center ${
              isSpeedOnDemandEnabled
                ? "grid-cols-2 md:grid-cols-4"
                : "grid-cols-2 md:grid-cols-3"
            }`}
          >
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-semibold text-muted-foreground">
                Status
              </h4>
              <div className="flex items-center justify-center gap-2 mt-1">
                <div
                  className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500 animate-glow-green" : "bg-red-500 animate-glow-red"}`}
                ></div>
                <p className="text-lg font-bold">
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-semibold text-muted-foreground">
                Uptime
              </h4>
              <p className="text-lg font-bold mt-1">
                {ssidInfo.uptime || "N/A"}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-semibold text-muted-foreground">
                Connected Devices
              </h4>
              <p className="text-lg font-bold mt-1">{allDevices.length}</p>
            </div>
            {/* Active Boost - Only show if Speed On Demand is enabled */}
            {isSpeedOnDemandEnabled && (
              <div className="p-4 border rounded-lg">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Active Boost
                </h4>
                <p className="text-lg font-bold mt-1">
                  {dashboardStatus.activeBoost?.profile || "None"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <CustomerView customerInfo={customerInfo} />
      </div>

      {/* Second Row: Status Overview and Devices Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Associated Devices</CardTitle>
              <CardDescription>
                A list of devices currently connected to your network.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssociatedDevicesTable devices={allDevices} />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <StatusView status={dashboardStatus} />
        </div>
      </div>

      {/* News and Promotions Section */}
      {trafficUsageEnabled && trafficUsage && (
        <Card>
          <CardHeader>
            <CardTitle>Pemakaian Traffic</CardTitle>
            <CardDescription>
              Ringkasan bandwidth saat ini, pemakaian hari ini, dan bulan
              berjalan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trafficUsage.hasPppoe ? (
              <div className="space-y-4">
                <CustomerTrafficLiveCard
                  enabled={trafficLiveEnabled}
                  compact
                  intervalMs={15000}
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Hari Ini</p>
                    <p className="mt-2 text-xl font-semibold">
                      {formatBytes(trafficUsage.today.totalBytes)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Down {formatBytes(trafficUsage.today.downloadBytes)} • Up{" "}
                      {formatBytes(trafficUsage.today.uploadBytes)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Bulan Ini</p>
                    <p className="mt-2 text-xl font-semibold">
                      {formatBytes(trafficUsage.currentMonth.totalBytes)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Down{" "}
                      {formatBytes(trafficUsage.currentMonth.downloadBytes)} •
                      Up {formatBytes(trafficUsage.currentMonth.uploadBytes)}
                    </p>
                  </div>
                  {trafficUsage.lastCollectedAt && (
                    <p className="text-xs text-muted-foreground md:col-span-2">
                      {trafficUsage.stale ? "Data terakhir" : "Update terakhir"}
                      :{" "}
                      {new Date(trafficUsage.lastCollectedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Akun ini belum memiliki layanan PPPoE yang bisa dimonitor.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Berita & Promo</CardTitle>
        </CardHeader>
        <CardContent>
          <NewsDisplay />
        </CardContent>
      </Card>
    </div>
  );
}
