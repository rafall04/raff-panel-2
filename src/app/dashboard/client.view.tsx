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
  CardBand,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusPill } from "@/components/ui/status";
import { SectionHeading } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { formatBytes, formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import AssociatedDevicesTable from "./associated-devices-table";
import AnnouncementDisplay from "./announcement-display";
import NewsDisplay from "./news-display";
import QuickActions from "./quick-actions";
import { useSpeedOnDemand } from "./speed-on-demand-context";
import CustomerTrafficLiveCard from "@/components/customer-traffic-live-card";

/** Down/up pair under a traffic figure. */
function TrafficSplit({
  download,
  upload,
}: {
  download: number;
  upload: number;
}) {
  return (
    <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <ArrowDownToLine className="h-3.5 w-3.5 text-brand" />
        <span className="tabular">{formatBytes(download)}</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <ArrowUpFromLine className="h-3.5 w-3.5 text-success" />
        <span className="tabular">{formatBytes(upload)}</span>
      </span>
    </div>
  );
}

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

  // Time-based greeting. Computed client-side (in an effect) to avoid a
  // server/client hydration mismatch on the hour.
  const [greeting, setGreeting] = useState("Selamat datang");
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(
      h < 11
        ? "Selamat pagi"
        : h < 15
          ? "Selamat siang"
          : h < 19
            ? "Selamat sore"
            : "Selamat malam",
    );
  }, []);

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
  const planName =
    customerInfo?.package || customerInfo?.packageName || "Paket Anda";

  return (
    <div className="space-y-6 lg:space-y-8">
      <AnnouncementDisplay />

      {/* ── Hero: who you are, whether you are online, and the headline stats ── */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="relative overflow-hidden border-b bg-gradient-to-br from-brand/12 via-brand/[0.04] to-transparent p-5 sm:p-6">
            {/* Decorative corner light. Pure gradient, no blur filter — the
                same look at a fraction of the paint cost on weak devices. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-60"
              style={{
                backgroundImage:
                  "radial-gradient(closest-side, hsl(var(--brand) / 0.22), transparent)",
              }}
            />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{greeting},</p>
                <p className="mt-0.5 truncate text-xl font-bold leading-tight sm:text-2xl">
                  {customerInfo?.name || "Pelanggan"}
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
                  Layanan
                  <span className="font-semibold text-foreground">
                    {planName}
                  </span>
                  {isOnline ? "berjalan normal." : "sedang tidak terhubung."}
                </p>
              </div>
              <StatusPill tone={isOnline ? "online" : "offline"} pulse>
                {isOnline ? "Online" : "Offline"}
              </StatusPill>
            </div>
          </div>

          <CardContent className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-3 sm:pt-5">
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
                hint={dashboardStatus.activeBoost ? "aktif" : "tidak aktif"}
                accent={dashboardStatus.activeBoost ? "brand" : "default"}
                className="col-span-2 sm:col-span-1"
              />
            ) : (
              <StatTile
                icon={Router}
                label="Jaringan"
                value={isOnline ? "Aktif" : "Terputus"}
                accent={isOnline ? "success" : "destructive"}
                className="col-span-2 sm:col-span-1"
              />
            )}
          </CardContent>

          <CardBand className="flex items-center justify-between gap-3">
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
              <RefreshCw className={cn(loading && "animate-spin")} />
              Segarkan
            </Button>
          </CardBand>
        </Card>

        <CustomerView customerInfo={customerInfo} />
      </section>

      {/* ── Shortcuts ─────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeading
          title="Aksi Cepat"
          description="Yang paling sering dibuka pelanggan."
        />
        <QuickActions />
      </section>

      {/* ── Devices + service status ──────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <span className="icon-chip h-9 w-9">
                <MonitorSmartphone className="h-[18px] w-[18px]" />
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

        <div className="lg:col-span-1">
          <StatusView status={dashboardStatus} />
        </div>
      </section>

      {/* ── Traffic usage ─────────────────────────────────────────────────── */}
      {trafficUsageEnabled && trafficUsage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <span className="icon-chip h-9 w-9">
                <Activity className="h-[18px] w-[18px]" />
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
                    <p className="eyebrow">Hari Ini</p>
                    <p className="tabular mt-2 text-2xl font-bold">
                      {formatBytes(trafficUsage.today.totalBytes)}
                    </p>
                    <TrafficSplit
                      download={trafficUsage.today.downloadBytes}
                      upload={trafficUsage.today.uploadBytes}
                    />
                  </div>
                  <div className="tile">
                    <p className="eyebrow">Bulan Ini</p>
                    <p className="tabular mt-2 text-2xl font-bold">
                      {formatBytes(trafficUsage.currentMonth.totalBytes)}
                    </p>
                    <TrafficSplit
                      download={trafficUsage.currentMonth.downloadBytes}
                      upload={trafficUsage.currentMonth.uploadBytes}
                    />
                  </div>
                  {trafficUsage.lastCollectedAt && (
                    <p className="text-xs text-muted-foreground sm:col-span-2">
                      {trafficUsage.stale ? "Data terakhir" : "Update terakhir"}
                      : {formatDateTime(trafficUsage.lastCollectedAt)}
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

      {/* ── News & promos ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <span className="icon-chip h-9 w-9">
              <Newspaper className="h-[18px] w-[18px]" />
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
