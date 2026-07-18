"use client";

import type { DashboardStatus } from "./actions";
import { Hourglass, Zap, MessageSquareWarning } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReportDialog } from "./report-dialog-context";
import { useSpeedOnDemand } from "./speed-on-demand-context";

export default function StatusView({ status }: { status: DashboardStatus }) {
  const { openDialog } = useReportDialog();
  const { isEnabled: isSpeedOnDemandEnabled } = useSpeedOnDemand();

  return (
    <div className="space-y-4">
      {/* Active Speed Boost - Only show if Speed On Demand is enabled */}
      {isSpeedOnDemandEnabled && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap size={18} /> Active Speed Boost
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status.activeBoost ? (
              <div className="text-muted-foreground">
                <p className="text-sm">
                  Your speed is currently boosted to{" "}
                  <span className="font-bold text-primary">
                    {status.activeBoost.profile}
                  </span>
                  .
                </p>
                <p className="text-xs mt-1">
                  Expires on:{" "}
                  {new Date(status.activeBoost.expiresAt).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active speed boost.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Report - Separate Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Hourglass size={18} /> Active Report
            </CardTitle>
            {!status.activeReport && (
              <Button
                variant="outline"
                size="sm"
                onClick={openDialog}
                className="h-8 text-xs w-full sm:w-auto"
              >
                <MessageSquareWarning size={14} className="mr-1.5" />
                Laporkan Masalah
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {status.activeReport ? (
            <div className="text-muted-foreground">
              <p className="text-sm break-words">
                Report{" "}
                <span className="font-bold text-primary">
                  #{status.activeReport.id}
                </span>{" "}
                ({status.activeReport.category}) is currently{" "}
                <span className="font-bold text-yellow-400">
                  {status.activeReport.status}
                </span>
                .
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You have no active reports.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
