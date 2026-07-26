"use client";

import { useEffect, useState } from "react";
import type { BillingHistoryItem } from "@/services/billing.service";
import { Receipt, ArrowDownCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { formatDate } from "@/lib/format";

const MONTHS = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n || 0);

export default function BillingHistory() {
  const [items, setItems] = useState<BillingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/billing-history");
        const json = (await res.json()) as {
          success: boolean;
          data?: BillingHistoryItem[];
          message?: string;
        };
        if (!res.ok || !json.success) {
          setError(json.message || "Gagal memuat riwayat tagihan");
          setItems([]);
          return;
        }
        setItems(Array.isArray(json.data) ? json.data : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Terjadi kesalahan");
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <ListSkeleton />;
  }
  if (error) {
    return (
      <EmptyState icon={Receipt} title="Gagal memuat" description={error} />
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Belum ada riwayat tagihan"
        description="Pembayaran Anda akan tercatat di sini."
      />
    );
  }

  return (
    <Timeline>
      {items.map((it, index) => (
        <TimelineItem
          key={it.id}
          icon={ArrowDownCircle}
          tone={it.status === "paid" ? "success" : "warning"}
          isLast={index === items.length - 1}
          title={`${MONTHS[it.periodMonth] || "Periode"} ${it.periodYear}`}
          meta={
            <>
              <span>{formatDate(it.createdAt)}</span>
              {it.paymentMethod ? (
                <>
                  <span aria-hidden="true">•</span>
                  <span>{it.paymentMethod}</span>
                </>
              ) : null}
            </>
          }
          trailing={
            <>
              <p className="tabular font-bold">{rupiah(it.amountPaid)}</p>
              <Badge variant={it.status === "paid" ? "success" : "warning"}>
                {it.status === "paid" ? "Lunas" : "Sebagian"}
              </Badge>
            </>
          }
        />
      ))}
    </Timeline>
  );
}
