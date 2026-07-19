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
import {
  RefreshCw,
  Clock,
  Rocket,
  MonitorSmartphone,
  Router,
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Newspaper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import AssociatedDevicesTable from "./associated-devices-table";
import AnnouncementDisplay from "./announcement-display";
import NewsDisplay from "./news-display";
import QuickActions from "./quick-actions";
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
    toast.info("Memuat ulang data...");
    try {
      await refreshObject();
      const newSsidInfo = await getWifiPageData();
      if (newSsidInfo) {
        setSSIDInfo(newSsidInfo);
        toast.success("Data berhasil diperbarui!");
        return;
      }

      toast.error("Data perangkat tidak tersedia saat ini.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memperbarui data.",
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
    <div className="space-y-5">
      <AnnouncementDisplay />

      {/* Hero: greeting + live connection status + key stats */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="relative border-b bg-gradient-to-br from-brand/10 via-transparent to-transparent p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Selamat datang,</p>
                <p className="truncate text-xl font-bold">
                  {customerInfo?.name || "Pelanggan"}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                  isOnline
                    ? "bg-success/15 text-success"
                    : "bg-destructive/15 text-destructive",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isOnline
                      ? "bg-success animate-glow-green"
                      : "bg-destructive animate-glow-red",
                  )}
                />
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>

          <CardContent
            className={cn(
              "grid grid-cols-2 gap-3 p-4",
              isSpeedOnDemandEnabled ? "sm:grid-cols-3" : "sm:grid-cols-3",
            )}
          >
            <StatTile
              icon={Clock}
              label="Uptime"
              value={ssidInfo.uptime || "N/A"}
            />
            <StatTile
              icon={MonitorSmartphone}
              label="Perangkat"
              value={allDevices.length}
              hint="terhubung"
              accent="brand"
            />
            {isSpeedOnDemandEnabled ? (
              <StatTile
                icon={Rocket}
                label="Boost"
                value={dashboardStatus.activeBoost?.profile || "—"}
                accent={dashboardStatus.activeBoost ? "brand" : "default"}
              />
            ) : (
              <StatTile
                icon={Router}
                label="Jaringan"
                value={isOnline ? "Aktif" : "Terputus"}
                accent={isOnline ? "success" : "destructive"}
              />
            )}
          </CardContent>

          <div className="flex items-center justify-between gap-2 border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Diperbarui otomatis tiap 5 menit
            </p>
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
                className={cn("mr-2", loading && "animate-spin")}
              />
              Segarkan
            </Button>
          </div>
        </Card>

        <CustomerView customerInfo={customerInfo} />
      </div>

      <QuickActions />

      {/* Devices + service status */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="icon-chip">
                  <MonitorSmartphone className="h-5 w-5" />
                </span>
                Perangkat Terhubung
              </CardTitle>
              <CardDescription>
                Daftar perangkat yang sedang terhubung ke jaringan Anda.
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

      {/* Traffic usage */}
      {trafficUsageEnabled && trafficUsage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="icon-chip">
                <Activity className="h-5 w-5" />
              </span>
              Pemakaian Traffic
            </CardTitle>
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="tile">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Hari Ini
                    </p>
                    <p className="mt-2 text-2xl font-bold">
                      {formatBytes(trafficUsage.today.totalBytes)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <ArrowDownToLine className="h-3.5 w-3.5 text-brand" />
                        {formatBytes(trafficUsage.today.downloadBytes)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ArrowUpFromLine className="h-3.5 w-3.5 text-success" />
                        {formatBytes(trafficUsage.today.uploadBytes)}
                      </span>
                    </div>
                  </div>
                  <div className="tile">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Bulan Ini
                    </p>
                    <p className="mt-2 text-2xl font-bold">
                      {formatBytes(trafficUsage.currentMonth.totalBytes)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <ArrowDownToLine className="h-3.5 w-3.5 text-brand" />
                        {formatBytes(trafficUsage.currentMonth.downloadBytes)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ArrowUpFromLine className="h-3.5 w-3.5 text-success" />
                        {formatBytes(trafficUsage.currentMonth.uploadBytes)}
                      </span>
                    </div>
                  </div>
                  {trafficUsage.lastCollectedAt && (
                    <p className="text-xs text-muted-foreground sm:col-span-2">
                      {trafficUsage.stale ? "Data terakhir" : "Update terakhir"}
                      :{" "}
                      {new Date(trafficUsage.lastCollectedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                Akun ini belum memiliki layanan PPPoE yang bisa dimonitor.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* News & promos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="icon-chip">
              <Newspaper className="h-5 w-5" />
            </span>
            Berita &amp; Promo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NewsDisplay />
        </CardContent>
      </Card>
    </div>
  );
}
