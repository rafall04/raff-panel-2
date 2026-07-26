"use client";

import type { LucideIcon } from "lucide-react";
import { Activity, ArrowDown, ArrowUp, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { useCustomerTrafficLive } from "@/hooks/use-customer-traffic-live";

interface CustomerTrafficLiveCardProps {
  enabled: boolean;
  compact?: boolean;
  intervalMs?: number;
}

function formatRelativeSample(value: string | null) {
  if (!value) {
    return "Belum ada sample";
  }
  return formatDateTime(value);
}

/**
 * One throughput reading. The figure is split from its unit so the number can
 * carry the weight while "Mbps" stays quiet — and so a three-digit rate does
 * not visually outrank a one-digit one.
 */
function RateTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "brand" | "success";
}) {
  const [figure, ...unit] = value.split(" ");

  return (
    <div className="tile flex flex-col gap-2">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.09em] text-muted-foreground">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md",
            tone === "brand"
              ? "bg-brand/12 text-brand"
              : "bg-success/12 text-success",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        {label}
      </p>
      <p className="tabular flex items-baseline gap-1.5 leading-none">
        <span
          className={cn(
            "text-2xl font-bold tracking-tight sm:text-[28px]",
            tone === "brand" ? "text-brand" : "text-success",
          )}
        >
          {figure}
        </span>
        <span className="text-sm font-medium text-muted-foreground">
          {unit.join(" ")}
        </span>
      </p>
    </div>
  );
}

function Notice({
  icon: Icon,
  title,
  children,
}: {
  icon?: LucideIcon;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
      {Icon ? <Icon className="mt-0.5 h-4 w-4 shrink-0" /> : null}
      <div>
        {title ? <p className="font-medium text-foreground">{title}</p> : null}
        <p>{children}</p>
      </div>
    </div>
  );
}

export default function CustomerTrafficLiveCard({
  enabled,
  compact = false,
  intervalMs = 10000,
}: CustomerTrafficLiveCardProps) {
  const { data, loading, error, refetch } = useCustomerTrafficLive({
    enabled,
    intervalMs,
  });

  if (!enabled) {
    return null;
  }

  const title = compact ? "Bandwidth Saat Ini" : "Bandwidth Live";
  const description = compact
    ? "Snapshot ringan dari trafik interface PPPoE aktif."
    : "Rate download dan upload dihitung dari dua snapshot interface PPPoE terbaru.";

  const isLive = Boolean(data?.online && !data.stale && !data.warmup);

  return (
    <Card className="border-border/70">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2.5">
              <span className="icon-chip h-9 w-9">
                <Activity className="h-[18px] w-[18px]" />
              </span>
              {title}
            </CardTitle>
            <CardDescription className="mt-1.5">{description}</CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {data?.online ? (
              <StatusPill
                tone={data.stale || data.warmup ? "pending" : "online"}
                // The pulse is the signal that the figures are still moving —
                // it runs only while the feed is genuinely live.
                pulse={isLive}
              >
                {data.warmup
                  ? "Menyiapkan"
                  : data.stale
                    ? "Data terakhir"
                    : "Live"}
              </StatusPill>
            ) : (
              <StatusPill tone="offline">Offline</StatusPill>
            )}
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => {
                void refetch();
              }}
              disabled={loading}
              aria-label="Muat ulang bandwidth"
            >
              <RefreshCw className={cn(loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {error && !data ? (
          <Notice>{error}</Notice>
        ) : data && !data.hasPppoe ? (
          <Notice>
            Akun ini belum memiliki layanan PPPoE yang bisa dimonitor.
          </Notice>
        ) : data && !data.online ? (
          <Notice icon={WifiOff} title="Sedang offline">
            Bandwidth live akan tampil otomatis saat sesi PPPoE aktif.
          </Notice>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 xs:grid-cols-2">
              <RateTile
                icon={ArrowDown}
                label="Download"
                value={data?.downloadHuman || "0 bps"}
                tone="brand"
              />
              <RateTile
                icon={ArrowUp}
                label="Upload"
                value={data?.uploadHuman || "0 bps"}
                tone="success"
              />
            </div>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="truncate">
                Interface:{" "}
                <span className="font-medium text-foreground">
                  {data?.interfaceName || "Tidak tersedia"}
                </span>
              </span>
              <span aria-hidden="true" className="hidden sm:inline">
                •
              </span>
              <span>
                Sample: {formatRelativeSample(data?.lastSampleAt || null)}
              </span>
            </p>
          </>
        )}

        {data?.stale && data.lastSampleAt && (
          <p className="text-xs text-muted-foreground">
            Menampilkan data terakhir karena router sedang lambat atau belum
            merespons sample baru.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
