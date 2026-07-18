"use client";

import { Activity, ArrowDown, ArrowUp, Router, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  return new Date(value).toLocaleString();
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

  return (
    <Card className="border-border/70">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {data?.online ? (
              <Badge variant={data.stale ? "outline" : "default"}>
                {data.warmup
                  ? "Menyiapkan sample"
                  : data.stale
                    ? "Data terakhir"
                    : "Live"}
              </Badge>
            ) : (
              <Badge variant="outline">Offline</Badge>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void refetch();
              }}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && !data ? (
          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            {error}
          </div>
        ) : data && !data.hasPppoe ? (
          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            Akun ini belum memiliki layanan PPPoE yang bisa dimonitor.
          </div>
        ) : data && !data.online ? (
          <div className="flex items-center gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            <WifiOff className="h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Sedang offline</p>
              <p>Bandwidth live akan tampil otomatis saat sesi PPPoE aktif.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border p-4">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <ArrowDown className="h-3.5 w-3.5" />
                Download
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-tight">
                {data?.downloadHuman || "0 bps"}
              </p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <ArrowUp className="h-3.5 w-3.5" />
                Upload
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-tight">
                {data?.uploadHuman || "0 bps"}
              </p>
            </div>
            <div className="rounded-2xl border p-4 sm:col-span-2 xl:col-span-1">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <Router className="h-3.5 w-3.5" />
                Interface
              </p>
              <p className="mt-3 truncate text-base font-medium text-foreground">
                {data?.interfaceName || "Tidak tersedia"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Sample: {formatRelativeSample(data?.lastSampleAt || null)}
              </p>
            </div>
          </div>
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
