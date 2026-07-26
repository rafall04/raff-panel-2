"use client";

import type { CustomerTrafficUsage } from "../actions";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpToLine,
  CalendarDays,
  Database,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatBytes, formatDateTime } from "@/lib/format";
import CustomerTrafficLiveCard from "@/components/customer-traffic-live-card";

interface Period {
  downloadBytes: number;
  uploadBytes: number;
  totalBytes: number;
}

/**
 * Period summary: the total as the headline, with the download/upload split
 * shown both as figures and as a single proportion bar. The bar answers "is my
 * usage mostly down or up?" at a glance, which two numbers side by side don't.
 */
function PeriodCard({
  title,
  subtitle,
  period,
}: {
  title: string;
  subtitle: string;
  period: Period;
}) {
  const total = period.totalBytes || 1;
  const downloadShare = Math.round((period.downloadBytes / total) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2.5">
          <span className="icon-chip h-9 w-9">
            <CalendarDays className="h-[18px] w-[18px]" />
          </span>
          {title}
        </CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="tabular text-3xl font-bold leading-none tracking-tight">
          {formatBytes(period.totalBytes)}
        </p>

        <div
          className="flex h-2 overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label={`Download ${downloadShare} persen dari total pemakaian`}
        >
          <div
            className="bg-brand transition-[width] duration-500"
            style={{ width: `${downloadShare}%` }}
          />
          <div className="flex-1 bg-success" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowDownToLine className="h-3.5 w-3.5 text-brand" />
              Download
            </p>
            <p className="tabular mt-1 font-semibold">
              {formatBytes(period.downloadBytes)}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowUpToLine className="h-3.5 w-3.5 text-success" />
              Upload
            </p>
            <p className="tabular mt-1 font-semibold">
              {formatBytes(period.uploadBytes)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TrafficView({
  usage,
  liveEnabled,
}: {
  usage: CustomerTrafficUsage;
  liveEnabled: boolean;
}) {
  if (!usage.hasPppoe) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Activity}
          eyebrow="Pemakaian"
          title="Pemakaian Traffic"
        />
        <Card>
          <CardContent className="pt-5">
            <EmptyState
              icon={Database}
              title="Belum ada layanan yang bisa dimonitor"
              description="Akun ini belum memiliki layanan PPPoE, sehingga pemakaian data tidak dapat ditampilkan."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // The busiest day sets the scale for every bar, so the history reads as one
  // comparable series rather than 30 unrelated rows.
  const peakBytes = Math.max(
    1,
    ...usage.dailyHistory.map((day) => day.totalBytes),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Activity}
        eyebrow="Pemakaian"
        title="Pemakaian Traffic"
        description={
          <>
            Ringkasan penggunaan data untuk{" "}
            <span className="font-medium text-foreground">
              {usage.pppoeUsername}
            </span>
            .
          </>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            {usage.stale && <Badge variant="warning">Data terakhir</Badge>}
            {usage.lastCollectedAt && (
              <span className="text-xs text-muted-foreground">
                Update: {formatDateTime(usage.lastCollectedAt)}
              </span>
            )}
          </div>
        }
      />

      <CustomerTrafficLiveCard enabled={liveEnabled} intervalMs={10000} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <PeriodCard
          title="Hari Ini"
          subtitle="Sejak pukul 00.00 waktu setempat."
          period={usage.today}
        />
        <PeriodCard
          title="Bulan Ini"
          subtitle="Akumulasi sejak tanggal 1."
          period={usage.currentMonth}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <span className="icon-chip h-9 w-9">
              <Database className="h-[18px] w-[18px]" />
            </span>
            Riwayat 30 Hari
          </CardTitle>
          <CardDescription>
            Panjang bar dihitung relatif terhadap hari dengan pemakaian
            tertinggi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usage.dailyHistory.length > 0 ? (
            <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border">
              {usage.dailyHistory.map((day) => (
                <li key={day.date} className="bg-card p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="tabular text-sm font-medium">
                      {day.date}
                    </span>
                    <span className="tabular text-sm font-semibold">
                      {formatBytes(day.totalBytes)}
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand-gradient"
                      style={{
                        width: `${Math.max(2, (day.totalBytes / peakBytes) * 100)}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <ArrowDownToLine className="h-3.5 w-3.5 text-brand" />
                      <span className="tabular">
                        {formatBytes(day.downloadBytes)}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ArrowUpToLine className="h-3.5 w-3.5 text-success" />
                      <span className="tabular">
                        {formatBytes(day.uploadBytes)}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Database}
              title="Belum ada data traffic"
              description="Pemakaian harian akan muncul di sini setelah sistem mengumpulkan sample pertama."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
