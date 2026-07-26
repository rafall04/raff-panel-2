"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CustomerInfo } from "../actions";
import { requestSpeedBoost } from "../actions";
import PaymentProofCard from "./payment-proof-card";
import type { SpeedRequestAwaitingProof } from "@/services/speed-boost.service";
import {
  ArrowRight,
  Check,
  Gauge,
  LoaderCircle,
  Rocket,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, SectionHeading } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { currencyFormatter } from "@/lib/format";
import { toast } from "sonner";
import { useSpeedOnDemand } from "../speed-on-demand-context";
import type {
  SpeedBoostDurationKey,
  SpeedBoostPackage,
} from "@/services/speed-boost.service";

/**
 * The durations the backend actually offers for a package, in a stable order.
 *
 * Only keys with a configured price are sent, so this filters rather than
 * assuming all three exist — reading `durations["7_days"].price` blindly is
 * what used to throw. The backend already ships a human label ("1 Hari"), so we
 * use it instead of prettifying the key ourselves.
 */
const DURATION_ORDER: SpeedBoostDurationKey[] = ["1_day", "3_days", "7_days"];

function offeredDurations(
  pkg: SpeedBoostPackage,
): Array<{ key: SpeedBoostDurationKey; label: string; price: number }> {
  return DURATION_ORDER.flatMap((key) => {
    const duration = pkg.durations[key];
    if (!duration || typeof duration.price !== "number") {
      return [];
    }
    return [
      {
        key,
        label: duration.label || key.replace("_", " "),
        price: duration.price,
      },
    ];
  });
}

export default function SpeedBoostView({
  currentCustomerInfo,
  requestAwaitingProof,
}: {
  currentCustomerInfo: CustomerInfo;
  requestAwaitingProof: SpeedRequestAwaitingProof | null;
}) {
  // Check Speed On Demand status using hook
  const { packages, isEnabled, loading, error } = useSpeedOnDemand();
  const router = useRouter();
  const [selectedBoost, setSelectedBoost] = useState<{
    targetPackage: SpeedBoostPackage;
    durationKey: SpeedBoostDurationKey;
    durationLabel: string;
    price: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  const currentPrice = Number(currentCustomerInfo.monthlyBill) || 0;
  const availableUpgrades = packages.filter(
    (pkg) => pkg.basePrice > currentPrice && offeredDurations(pkg).length > 0,
  );

  const handleBoostClick = (
    targetPackage: SpeedBoostPackage,
    duration: { key: SpeedBoostDurationKey; label: string; price: number },
  ) => {
    setSelectedBoost({
      targetPackage,
      durationKey: duration.key,
      durationLabel: duration.label,
      price: duration.price,
    });
    setConfirmOpen(true);
  };

  const handleConfirmBoost = async () => {
    if (!selectedBoost) {
      return;
    }

    setIsLoading(true);
    const promise = requestSpeedBoost(
      selectedBoost.targetPackage.name,
      selectedBoost.durationKey,
    );

    toast.promise(promise, {
      loading: "Mengirim permintaan...",
      success: (result) => {
        if (result.needsPaymentProof) {
          // Ambil ulang data server supaya kartu bukti bayar muncul untuk permintaan yang baru saja
          // dibuat, tanpa pelanggan perlu me-refresh halaman sendiri.
          router.refresh();
        }
        return result.message;
      },
      error: (err: Error) => err.message,
      // Menutup dialog di sini, bukan hanya di cabang success: `finally` menihilkan
      // selectedBoost, jadi kalau dialog dibiarkan terbuka setelah gagal ia kehilangan
      // deskripsinya DAN tombol Confirm-nya mati (dijaga `if (!selectedBoost) return`).
      finally: () => {
        setConfirmOpen(false);
        setIsLoading(false);
        setSelectedBoost(null);
      },
    });
  };

  // Bagian "beli boost" saja yang bergantung pada status fitur. Kartu bukti bayar sengaja berada
  // di luar gerbang ini: kalau pelanggan sudah terlanjur meminta boost, kewajiban membayarnya tidak
  // hilang hanya karena admin mematikan fitur atau daftar paket gagal dimuat — memblokirnya justru
  // membuat pelanggan terjebak tanpa cara mengirim bukti.
  const renderBoostSection = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-56 rounded-xl" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <EmptyState
          icon={Rocket}
          title="Gagal memuat paket boost"
          description={error || "Gagal memuat informasi Speed On Demand."}
        />
      );
    }

    if (!isEnabled) {
      return (
        <EmptyState
          icon={Rocket}
          tone="brand"
          title="Speed On Demand belum tersedia"
          description="Layanan ini sedang tidak aktif. Coba lagi nanti atau hubungi admin."
        />
      );
    }

    if (packages.length === 0 || availableUpgrades.length === 0) {
      return (
        <EmptyState
          icon={Sparkles}
          tone="brand"
          title="Anda sudah di paket tertinggi"
          description="Tidak ada peningkatan kecepatan yang bisa ditambahkan ke paket Anda saat ini."
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {availableUpgrades.map((pkg) => (
          <Card key={pkg.name} className="card-hover flex flex-col">
            <CardHeader className="gap-3">
              <span className="icon-chip-solid">
                <Gauge className="h-5 w-5" />
              </span>
              <div>
                <p className="eyebrow">Tingkatkan ke</p>
                <CardTitle className="mt-1 text-xl">{pkg.profile}</CardTitle>
                <CardDescription className="mt-1">
                  Setara dengan paket {pkg.name}, aktif sementara.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="mt-auto space-y-2">
              {offeredDurations(pkg).map((duration) => (
                <button
                  key={duration.key}
                  type="button"
                  onClick={() => handleBoostClick(pkg, duration)}
                  className="tile-interactive group flex w-full items-center justify-between gap-3 p-3 text-left"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {duration.label}
                    </span>
                    <span className="tabular block text-xs text-muted-foreground">
                      {currencyFormatter.format(duration.price)}
                    </span>
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand transition-transform duration-200 group-hover:translate-x-0.5">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Rocket}
        eyebrow="Layanan Tambahan"
        title="Speed on Demand"
        description="Tingkatkan kecepatan sementara saat Anda butuh performa ekstra."
      />

      {requestAwaitingProof && (
        <PaymentProofCard
          request={requestAwaitingProof}
          onUploaded={() => router.refresh()}
        />
      )}

      <Card>
        <CardContent className="pt-5">
          <div className="brand-panel flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="eyebrow text-brand">Paket Aktif Anda</p>
              <p className="mt-1 truncate text-lg font-bold">
                {currentCustomerInfo.packageName}
              </p>
            </div>
            <p className="tabular shrink-0 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {currencyFormatter.format(currentCustomerInfo.monthlyBill)}
              </span>{" "}
              / bulan
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <SectionHeading
          title="Boost yang Tersedia"
          description="Pilih kecepatan dan durasinya. Pembayaran dikonfirmasi oleh admin."
        />
        {renderBoostSection()}
      </section>

      <Dialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Speed Boost</DialogTitle>
            {selectedBoost && (
              <DialogDescription>
                Anda akan mengaktifkan boost ke{" "}
                <b className="text-brand">
                  {selectedBoost.targetPackage.profile}
                </b>{" "}
                selama {selectedBoost.durationLabel} dengan biaya{" "}
                <b className="tabular text-brand">
                  {currencyFormatter.format(selectedBoost.price)}
                </b>
                .
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                void handleConfirmBoost();
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Check />
              )}
              Konfirmasi &amp; Aktifkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
