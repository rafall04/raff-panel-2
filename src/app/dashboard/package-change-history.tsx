"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { currencyFormatter, formatDateTime } from "@/lib/format";
import type { PackageChangeRequest } from "@/services/package-change.service";
import { ArrowRight, Package, User, FileText } from "lucide-react";

const formatCurrency = (amount: number): string =>
  currencyFormatter.format(amount);

const formatDate = (dateString: string | null): string =>
  dateString ? formatDateTime(dateString) : "N/A";

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];
type Tone = React.ComponentProps<typeof TimelineItem>["tone"];

/**
 * Status → presentation. Previously this was raw palette classes
 * (`bg-yellow-500/20 text-yellow-600`), which ignored the theme entirely and
 * looked wrong in dark mode; the badge variants are token-driven.
 */
const STATUS: Record<
  string,
  { label: string; variant: BadgeVariant; tone: Tone }
> = {
  pending: { label: "Menunggu", variant: "warning", tone: "warning" },
  approved: { label: "Disetujui", variant: "success", tone: "success" },
  rejected: { label: "Ditolak", variant: "danger", tone: "destructive" },
  cancelled: { label: "Dibatalkan", variant: "secondary", tone: "muted" },
};

function statusFor(status: string) {
  return (
    STATUS[status] ?? {
      label: status.toUpperCase(),
      variant: "outline" as const,
      tone: "muted" as const,
    }
  );
}

/** Card chrome shared by every state, so the heading never disappears mid-load. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5">
          <span className="icon-chip h-9 w-9">
            <Package className="h-[18px] w-[18px]" />
          </span>
          Riwayat Perubahan Paket
        </CardTitle>
        <CardDescription>
          Riwayat semua permintaan perubahan paket Anda.
        </CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** Label/value pair inside a request's detail grid. */
function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="eyebrow">{label}</p>
      <p className="mt-0.5 break-words text-sm">{value}</p>
    </div>
  );
}

export default function PackageChangeHistory() {
  const [data, setData] = useState<PackageChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/package-change-history");

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          setError(errorData.message || "Gagal mengambil riwayat");
          setData([]);
          return;
        }

        const response = (await res.json()) as {
          success: boolean;
          data?: PackageChangeRequest[];
          message?: string;
        };

        if (!response.success || !Array.isArray(response.data)) {
          setError(response.message || "Gagal mengambil riwayat");
          setData([]);
          return;
        }

        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Shell>
        <ListSkeleton rows={2} />
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <EmptyState icon={Package} title="Gagal memuat" description={error} />
      </Shell>
    );
  }

  if (data.length === 0) {
    return (
      <Shell>
        <EmptyState
          icon={Package}
          title="Belum ada riwayat"
          description="Permintaan perubahan paket Anda akan muncul di sini."
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <Timeline>
        {data.map((request, index) => {
          const status = statusFor(request.status);
          return (
            <TimelineItem
              key={request.id}
              icon={Package}
              tone={status.tone}
              isLast={index === data.length - 1}
              title={
                <span className="flex flex-wrap items-center gap-1.5">
                  {request.currentPackageName}
                  <ArrowRight
                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                    aria-label="menjadi"
                  />
                  <span className="text-brand">
                    {request.requestedPackageName}
                  </span>
                </span>
              }
              meta={<span>Diajukan {formatDate(request.createdAt)}</span>}
              trailing={<Badge variant={status.variant}>{status.label}</Badge>}
            >
              <div className="tile space-y-3 p-3.5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Detail
                    label="Paket Saat Ini"
                    value={
                      <>
                        {request.currentPackageName}{" "}
                        <span className="tabular text-muted-foreground">
                          ({formatCurrency(request.currentPackagePrice)})
                        </span>
                      </>
                    }
                  />
                  <Detail
                    label="Paket Diminta"
                    value={
                      <>
                        {request.requestedPackageName}{" "}
                        <span className="tabular text-muted-foreground">
                          ({formatCurrency(request.requestedPackagePrice)})
                        </span>
                      </>
                    }
                  />
                  {request.updatedAt && (
                    <Detail
                      label="Terakhir Diperbarui"
                      value={formatDate(request.updatedAt)}
                    />
                  )}
                  {request.approvedBy && (
                    <Detail
                      label="Ditinjau Oleh"
                      value={
                        <span className="inline-flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {request.approvedBy}
                        </span>
                      }
                    />
                  )}
                </div>

                {request.notes && (
                  <div className="flex items-start gap-2 border-t pt-3 text-sm text-muted-foreground">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="min-w-0 break-words">{request.notes}</p>
                  </div>
                )}
              </div>
            </TimelineItem>
          );
        })}
      </Timeline>
    </Shell>
  );
}
