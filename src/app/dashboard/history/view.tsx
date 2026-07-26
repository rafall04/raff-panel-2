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
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { formatDate } from "@/lib/format";
import BillingHistory from "./billing-history";
import WifiHistory from "./wifi-history";
import PackageChangeHistory from "../package-change-history";

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

const REPORT_STATUS: Record<string, { label: string; variant: BadgeVariant }> =
  {
    Completed: { label: "Selesai", variant: "success" },
    "In Progress": { label: "Diproses", variant: "brand" },
    Cancelled: { label: "Dibatalkan", variant: "danger" },
  };

const ReportStatusBadge = ({
  status,
}: {
  status: ReportHistoryItem["status"];
}) => {
  const entry = REPORT_STATUS[status] ?? {
    label: status,
    variant: "secondary" as const,
  };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
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
    <Timeline>
      {history.map((item, index) => (
        <TimelineItem
          key={item.id}
          icon={MessageSquareWarning}
          tone={item.status === "Completed" ? "success" : "warning"}
          isLast={index === history.length - 1}
          title={item.category}
          meta={
            <>
              <span>Dilaporkan {formatDate(item.submittedAt)}</span>
              <span aria-hidden="true">•</span>
              <span className="tabular">#{item.id}</span>
            </>
          }
          trailing={<ReportStatusBadge status={item.status} />}
        />
      ))}
    </Timeline>
  );
}

export default function HistoryView({
  reports,
}: {
  reports: ReportHistoryItem[];
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={History}
        eyebrow="Aktivitas"
        title="Riwayat"
        description="Semua aktivitas akun Anda dalam satu tempat."
      />

      <Tabs defaultValue="tagihan" className="w-full">
        {/* Scrollable rather than a rigid 4-column grid: at 375px the old grid
            squeezed each label to about five legible characters. */}
        <TabsList className="w-full">
          <TabsTrigger value="tagihan">
            <Receipt />
            Tagihan
          </TabsTrigger>
          <TabsTrigger value="laporan">
            <MessageSquareWarning />
            Laporan
          </TabsTrigger>
          <TabsTrigger value="wifi">
            <Wifi />
            WiFi
          </TabsTrigger>
          <TabsTrigger value="paket">
            <PackageCheck />
            Paket
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tagihan">
          <Card>
            <CardContent className="pt-5">
              <BillingHistory />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="laporan">
          <Card>
            <CardContent className="pt-5">
              <ReportsList history={reports} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wifi">
          <Card>
            <CardContent className="pt-5">
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
