"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CustomerInfo } from "../actions";
import { requestSpeedBoost } from "../actions";
import PaymentProofCard from "./payment-proof-card";
import type { SpeedRequestAwaitingProof } from "@/services/speed-boost.service";
import { ArrowRight, Check, LoaderCircle, Rocket } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useSpeedOnDemand } from "../speed-on-demand-context";
import type {
  SpeedBoostDurationKey,
  SpeedBoostPackage,
} from "@/services/speed-boost.service";

// Helper to format currency
const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

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

  // Bagian "beli boost" saja yang bergantung pada status fitur. Kartu bukti bayar sengaja berada
  // di luar gerbang ini: kalau pelanggan sudah terlanjur meminta boost, kewajiban membayarnya tidak
  // hilang hanya karena admin mematikan fitur atau daftar paket gagal dimuat — memblokirnya justru
  // membuat pelanggan terjebak tanpa cara mengirim bukti.
  const renderBoostSection = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <LoaderCircle className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Memuat...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="w-full flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-lg">
            <AlertDescription>
              {error || "Gagal memuat informasi Speed On Demand."}
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    if (!isEnabled) {
      return (
        <div className="w-full flex items-center justify-center p-4">
          <Alert className="max-w-lg">
            <Rocket className="h-4 w-4" />
            <AlertDescription>
              Speed On Demand sedang tidak tersedia saat ini.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    if (packages.length === 0) {
      return (
        <div className="w-full flex items-center justify-center p-4">
          <Alert className="max-w-lg">
            <Rocket className="h-4 w-4" />
            <AlertDescription>
              Tidak ada paket speed boost yang tersedia untuk paket Anda saat
              ini.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Your Current Package</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">
                {currentCustomerInfo.packageName}
              </CardTitle>
              <CardDescription>
                {currencyFormatter.format(currentCustomerInfo.monthlyBill)} /
                month
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Available Speed Boosts</h2>
          {availableUpgrades.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableUpgrades.map((pkg) => (
                <Card key={pkg.name}>
                  <CardHeader>
                    <CardTitle>Boost to {pkg.profile}</CardTitle>
                    <CardDescription>
                      Temporarily upgrade to the speed of {pkg.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {offeredDurations(pkg).map((duration) => (
                      <Button
                        key={duration.key}
                        onClick={() => handleBoostClick(pkg, duration)}
                        variant="outline"
                        className="w-full justify-between group"
                      >
                        <span>
                          Boost for {duration.label} -{" "}
                          {currencyFormatter.format(duration.price)}
                        </span>
                        <ArrowRight className="group-hover:translate-x-1 transition-transform h-4 w-4" />
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border rounded-lg">
              <p className="text-lg text-muted-foreground">
                You are already on the highest tier package.
              </p>
              <p className="text-sm text-muted-foreground">
                No speed boosts available.
              </p>
            </div>
          )}
        </div>
      </>
    );
  };

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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 flex items-center">
        <Rocket className="mr-3" />
        Speed on Demand
      </h1>
      <p className="text-muted-foreground mb-6">
        Upgrade your speed temporarily to handle heavy tasks.
      </p>

      {requestAwaitingProof && (
        <PaymentProofCard
          request={requestAwaitingProof}
          onUploaded={() => router.refresh()}
        />
      )}

      {renderBoostSection()}

      <Dialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Speed Boost</DialogTitle>
            {selectedBoost && (
              <DialogDescription>
                You are about to activate a boost to{" "}
                <b className="text-primary">
                  {selectedBoost.targetPackage.profile}
                </b>{" "}
                for {selectedBoost.durationLabel} at a cost of{" "}
                <b className="text-primary">
                  {currencyFormatter.format(selectedBoost.price)}
                </b>
                .
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                void handleConfirmBoost();
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <LoaderCircle className="animate-spin mr-2" />
              ) : (
                <Check className="mr-2" />
              )}
              Confirm & Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
