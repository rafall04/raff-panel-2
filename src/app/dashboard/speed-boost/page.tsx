import { getCustomerInfo, getSpeedRequestAwaitingProof } from "../actions";
import SpeedBoostView from "./view";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { AlertTriangle, Rocket } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SpeedBoostPage() {
  // Independent reads — fetch together rather than making the page wait for one
  // then the other.
  const [customerInfo, awaitingProof] = await Promise.all([
    getCustomerInfo(),
    getSpeedRequestAwaitingProof(),
  ]);

  // We need customer info to filter packages, so it's a critical dependency
  if (!customerInfo) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Rocket}
          eyebrow="Layanan Tambahan"
          title="Speed on Demand"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Gagal memuat data akun"
          description="Kami tidak bisa mengambil informasi langganan Anda saat ini. Silakan coba lagi beberapa saat lagi."
        />
      </div>
    );
  }

  return (
    <SpeedBoostView
      currentCustomerInfo={customerInfo}
      requestAwaitingProof={awaitingProof}
    />
  );
}
