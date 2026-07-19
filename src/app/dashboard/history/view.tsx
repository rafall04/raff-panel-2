"use client";

import type { ReportHistoryItem } from "../actions";
import {
  History,
  Receipt,
  MessageSquareWarning,
  Wifi,
  PackageCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import BillingHistory from "./billing-history";
import WifiHistory from "./wifi-history";
import PackageChangeHistory from "../package-change-history";

const ReportStatusBadge = ({
  status,
}: {
  status: ReportHistoryItem["status"];
}) => {
  const map: Record<string, { label: string; className: string }> = {
    Completed: {
      label: "Selesai",
      className: "bg-success/15 text-success",
    },
    "In Progress": {
      label: "Diproses",
      className: "bg-brand/15 text-brand",
    },
    Cancelled: {
      label: "Dibatalkan",
      className: "bg-destructive/15 text-destructive",
    },
  };
  const entry = map[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };
  return (
    <Badge className={`border-transparent ${entry.className}`}>
      {entry.label}
    </Badge>
  );
};

function ReportsList({ history }: { history: ReportHistoryItem[] }) {
  if (!history.length) {
    return (
      <EmptyState
        icon={MessageSquareWarning}
        title="Belum ada laporan"
        description="Laporan gangguan yang Anda kirim akan muncul di sini."
      />
    );
  }
  return (
    <div className="space-y-3">
      {history.map((item) => (
        <div
          key={item.id}
          className="tile flex items-start justify-between gap-3"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className="icon-chip mt-0.5 h-10 w-10">
              <MessageSquareWarning className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold">{item.category}</p>
              <p className="text-xs text-muted-foreground">
                Dilaporkan{" "}
                {new Date(item.submittedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}{" "}
                • #{item.id}
              </p>
            </div>
          </div>
          <ReportStatusBadge status={item.status} />
        </div>
      ))}
    </div>
  );
}

export default function HistoryView({
  reports,
}: {
  reports: ReportHistoryItem[];
}) {
  return (
    <div className="space-y-5">
      <PageHeader
        icon={History}
        title="Riwayat"
        description="Semua aktivitas akun Anda dalam satu tempat."
      />

      <Tabs defaultValue="tagihan" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tagihan" className="px-1.5 text-xs">
            <Receipt className="mr-1 h-3.5 w-3.5" />
            Tagihan
          </TabsTrigger>
          <TabsTrigger value="laporan" className="px-1.5 text-xs">
            <MessageSquareWarning className="mr-1 h-3.5 w-3.5" />
            Laporan
          </TabsTrigger>
          <TabsTrigger value="wifi" className="px-1.5 text-xs">
            <Wifi className="mr-1 h-3.5 w-3.5" />
            WiFi
          </TabsTrigger>
          <TabsTrigger value="paket" className="px-1.5 text-xs">
            <PackageCheck className="mr-1 h-3.5 w-3.5" />
            Paket
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tagihan">
          <Card>
            <CardContent className="pt-6">
              <BillingHistory />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="laporan">
          <Card>
            <CardContent className="pt-6">
              <ReportsList history={reports} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wifi">
          <Card>
            <CardContent className="pt-6">
              <WifiHistory />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paket">
          <PackageChangeHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
