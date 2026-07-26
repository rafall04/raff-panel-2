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
import { formatDateTime } from "@/lib/format";
import { useReportDialog } from "./report-dialog-context";
import { useSpeedOnDemand } from "./speed-on-demand-context";

export default function StatusView({ status }: { status: DashboardStatus }) {
  const { openDialog } = useReportDialog();
  const { isEnabled: isSpeedOnDemandEnabled } = useSpeedOnDemand();

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-1">
      {/* Active Speed Boost - Only show if Speed On Demand is enabled */}
      {isSpeedOnDemandEnabled && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5 text-[15px]">
              <span className="icon-chip h-8 w-8">
                <Zap className="h-4 w-4" />
              </span>
              Speed Boost Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status.activeBoost ? (
              <div className="brand-panel p-3.5">
                <p className="text-sm leading-relaxed">
                  Kecepatan Anda sedang ditingkatkan ke{" "}
                  <span className="font-bold text-brand">
                    {status.activeBoost.profile}
                  </span>
                  .
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Berakhir: {formatDateTime(status.activeBoost.expiresAt)}
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
          <CardTitle className="flex items-center gap-2.5 text-[15px]">
            <span className="icon-chip h-8 w-8">
              <Hourglass className="h-4 w-4" />
            </span>
            Laporan Aktif
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {status.activeReport ? (
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-3.5">
              <p className="break-words text-sm">
                Laporan{" "}
                <span className="tabular font-bold">
                  #{status.activeReport.id}
                </span>{" "}
                <span className="text-muted-foreground">
                  ({status.activeReport.category})
                </span>
              </p>
              <Badge variant="warning" className="mt-2">
                {status.activeReport.status}
              </Badge>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                Tidak ada laporan aktif.
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={openDialog}
                className="w-full"
              >
                <MessageSquareWarning />
                Laporkan Masalah
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
