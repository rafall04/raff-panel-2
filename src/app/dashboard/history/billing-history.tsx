"use client";

import { useEffect, useState } from "react";
import type { BillingHistoryItem } from "@/services/billing.service";
import { Loader2, Receipt, ArrowDownCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

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
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat riwayat
        tagihan...
      </div>
    );
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
    <div className="space-y-3">
      {items.map((it) => (
        <div
          key={it.id}
          className="tile flex items-center justify-between gap-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
              <ArrowDownCircle className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {MONTHS[it.periodMonth] || "Periode"} {it.periodYear}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(it.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {it.paymentMethod ? ` • ${it.paymentMethod}` : ""}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-bold">{rupiah(it.amountPaid)}</p>
            <Badge
              className={
                it.status === "paid"
                  ? "border-transparent bg-success/15 text-success hover:bg-success/15"
                  : "border-transparent bg-warning/15 text-warning hover:bg-warning/15"
              }
            >
              {it.status === "paid" ? "Lunas" : "Sebagian"}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
