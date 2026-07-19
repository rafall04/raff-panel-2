"use client";

import type { DashboardStatus } from "./actions";
import {
  Hourglass,
  Zap,
  MessageSquareWarning,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useReportDialog } from "./report-dialog-context";
import { useSpeedOnDemand } from "./speed-on-demand-context";

export default function StatusView({ status }: { status: DashboardStatus }) {
  const { openDialog } = useReportDialog();
  const { isEnabled: isSpeedOnDemandEnabled } = useSpeedOnDemand();

  return (
    <div className="space-y-5">
      {/* Active Speed Boost - Only show if Speed On Demand is enabled */}
      {isSpeedOnDemandEnabled && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="icon-chip h-8 w-8">
                <Zap className="h-4 w-4" />
              </span>
              Speed Boost Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status.activeBoost ? (
              <div className="rounded-xl border border-brand/20 bg-brand/10 p-3">
                <p className="text-sm">
                  Kecepatan Anda sedang ditingkatkan ke{" "}
                  <span className="font-bold text-brand">
                    {status.activeBoost.profile}
                  </span>
                  .
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Berakhir:{" "}
                  {new Date(status.activeBoost.expiresAt).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tidak ada speed boost aktif.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Report */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="icon-chip h-8 w-8">
                <Hourglass className="h-4 w-4" />
              </span>
              Laporan Aktif
            </CardTitle>
            {!status.activeReport && (
              <Button
                variant="outline"
                size="sm"
                onClick={openDialog}
                className="h-8 w-full text-xs sm:w-auto"
              >
                <MessageSquareWarning size={14} className="mr-1.5" />
                Laporkan Masalah
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {status.activeReport ? (
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-3">
              <p className="break-words text-sm">
                Laporan{" "}
                <span className="font-bold">#{status.activeReport.id}</span>{" "}
                <span className="text-muted-foreground">
                  ({status.activeReport.category})
                </span>
              </p>
              <Badge className="mt-2 border-transparent bg-warning/15 text-warning hover:bg-warning/15">
                {status.activeReport.status}
              </Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Tidak ada laporan aktif.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
