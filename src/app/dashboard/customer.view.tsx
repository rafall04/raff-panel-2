"use client";

import type { CustomerInfo } from "./actions";
import { User, Package, Calendar, ShieldCheck, MapPin } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoRow } from "@/components/ui/info-row";

const PaymentStatusBadge = ({ status }: { status?: string | null }) => {
  // If status is null/undefined, don't render anything (feature is hidden)
  if (!status) {
    return null;
  }

  const statusUpper = status.toUpperCase();
  if (statusUpper === "PAID") {
    return <Badge variant="success">{status}</Badge>;
  }
  if (statusUpper === "UNPAID") {
    return <Badge variant="danger">{status}</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
};

function SubscriptionCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5">
          <span className="icon-chip h-9 w-9">
            <User className="h-[18px] w-[18px]" />
          </span>
          Langganan &amp; Tagihan
        </CardTitle>
      </CardHeader>
      {children}
    </Card>
  );
}

export default function CustomerView({
  customerInfo,
}: {
  customerInfo: CustomerInfo | null;
}) {
  if (!customerInfo) {
    return (
      <SubscriptionCard>
        <CardContent>
          <EmptyState
            icon={User}
            title="Data pelanggan tidak tersedia"
            description="Kami belum bisa mengambil detail akun Anda. Coba muat ulang beberapa saat lagi."
          />
        </CardContent>
      </SubscriptionCard>
    );
  }

  return (
    <SubscriptionCard>
      <CardContent className="flex flex-1 flex-col gap-4">
        {/* The plan is the one thing customers open this card for, so it gets
            the brand wash and the largest type on the card. */}
        <div className="brand-panel">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow text-brand">Paket Anda</p>
              <p className="mt-1 truncate text-lg font-bold leading-tight">
                {customerInfo.package || customerInfo.packageName || "N/A"}
              </p>
              {customerInfo.monthlyBillFormatted && (
                <p className="mt-1.5 text-sm text-muted-foreground">
                  <span className="tabular font-semibold text-foreground">
                    {customerInfo.monthlyBillFormatted}
                  </span>{" "}
                  / bulan
                </p>
              )}
            </div>
            <span className="icon-chip-solid">
              <Package className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div className="space-y-3.5">
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
            value={customerInfo.address || "—"}
          />
        </div>
      </CardContent>
    </SubscriptionCard>
  );
}
