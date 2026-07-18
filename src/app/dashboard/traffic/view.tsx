"use client";

import type { CustomerTrafficUsage } from "../actions";
import { Activity, ArrowDownToLine, ArrowUpToLine, Router } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CustomerTrafficLiveCard from "@/components/customer-traffic-live-card";

function formatBytes(value: number) {
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity size={20} />
            Pemakaian Traffic
          </CardTitle>
          <CardDescription>
            Akun ini belum memiliki layanan PPPoE yang bisa dimonitor.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="h-7 w-7" />
            Pemakaian Traffic
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Ringkasan penggunaan data harian dan bulan berjalan untuk{" "}
            <span className="font-medium text-foreground">
              {usage.pppoeUsername}
            </span>
            .
          </p>
        </div>
        <div className="flex items-center gap-2">
          {usage.stale && <Badge variant="outline">Data terakhir</Badge>}
          {usage.lastCollectedAt && (
            <span className="text-xs text-muted-foreground">
              Update: {new Date(usage.lastCollectedAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <CustomerTrafficLiveCard enabled={liveEnabled} intervalMs={10000} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hari Ini</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <ArrowDownToLine size={14} />
                Download
              </p>
              <p className="text-xl font-semibold mt-1">
                {formatBytes(usage.today.downloadBytes)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <ArrowUpToLine size={14} />
                Upload
              </p>
              <p className="text-xl font-semibold mt-1">
                {formatBytes(usage.today.uploadBytes)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Router size={14} />
                Total
              </p>
              <p className="text-xl font-semibold mt-1">
                {formatBytes(usage.today.totalBytes)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bulan Ini</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <ArrowDownToLine size={14} />
                Download
              </p>
              <p className="text-xl font-semibold mt-1">
                {formatBytes(usage.currentMonth.downloadBytes)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <ArrowUpToLine size={14} />
                Upload
              </p>
              <p className="text-xl font-semibold mt-1">
                {formatBytes(usage.currentMonth.uploadBytes)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Router size={14} />
                Total
              </p>
              <p className="text-xl font-semibold mt-1">
                {formatBytes(usage.currentMonth.totalBytes)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat 30 Hari</CardTitle>
          <CardDescription>
            Nilai di bawah merupakan akumulasi download dan upload per hari.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {usage.dailyHistory.length > 0 ? (
              usage.dailyHistory.map((day) => (
                <div
                  key={day.date}
                  className="grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-[140px_1fr_1fr_1fr]"
                >
                  <div className="font-medium">{day.date}</div>
                  <div>
                    <p className="text-xs text-muted-foreground">Download</p>
                    <p className="font-medium">
                      {formatBytes(day.downloadBytes)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Upload</p>
                    <p className="font-medium">
                      {formatBytes(day.uploadBytes)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-medium">{formatBytes(day.totalBytes)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                Belum ada data traffic yang tersimpan.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
