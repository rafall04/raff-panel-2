"use client";

import type { ReactNode } from "react";
import type { CustomerInfo } from "./actions";
import type { LucideIcon } from "lucide-react";
import { User, Package, Calendar, ShieldCheck, MapPin } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

const PaymentStatusBadge = ({ status }: { status?: string | null }) => {
  // If status is null/undefined, don't render anything (feature is hidden)
  if (!status) {
    return null;
  }

  const statusUpper = status.toUpperCase();
  if (statusUpper === "PAID") {
    return (
      <Badge className="border-transparent bg-success text-success-foreground hover:bg-success">
        {status}
      </Badge>
    );
  }
  if (statusUpper === "UNPAID") {
    return <Badge variant="destructive">{status}</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
};

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

export default function CustomerView({
  customerInfo,
}: {
  customerInfo: CustomerInfo | null;
}) {
  if (!customerInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="icon-chip">
              <User className="h-5 w-5" />
            </span>
            Langganan &amp; Tagihan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={User}
            title="Data pelanggan tidak tersedia"
            description="Kami belum bisa mengambil detail akun Anda. Coba muat ulang beberapa saat lagi."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="icon-chip">
            <User className="h-5 w-5" />
          </span>
          Langganan &amp; Tagihan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Highlighted plan */}
        <div className="rounded-xl border border-brand/20 bg-brand/10 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                Paket Anda
              </p>
              <p className="mt-1 truncate text-lg font-bold">
                {customerInfo.package || customerInfo.packageName || "N/A"}
              </p>
              {customerInfo.monthlyBillFormatted && (
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {customerInfo.monthlyBillFormatted}
                  </span>{" "}
                  / bulan
                </p>
              )}
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-brand-foreground shadow-brand-glow">
              <Package className="h-5 w-5" />
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3">
          {customerInfo.dueDateFormatted && (
            <InfoRow
              icon={Calendar}
              label="Jatuh Tempo"
              value={customerInfo.dueDateFormatted}
            />
          )}
          {customerInfo.paymentStatus && (
            <InfoRow
              icon={ShieldCheck}
              label="Status Pembayaran"
              value={<PaymentStatusBadge status={customerInfo.paymentStatus} />}
            />
          )}
          <InfoRow
            icon={MapPin}
            label="Alamat"
            value={
              <span className="whitespace-normal">
                {customerInfo.address || "—"}
              </span>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
