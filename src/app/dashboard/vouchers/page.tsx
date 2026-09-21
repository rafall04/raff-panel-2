import { Ticket, PowerOff } from "lucide-react";
import { getVoucherPageData } from "../actions";
import VoucherView from "./view";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function VouchersPage() {
  const data = await getVoucherPageData();

  // `enabled: false` juga yang dikembalikan saat backend bermasalah — keduanya berarti
  // "jangan tawarkan pembelian", jadi satu tampilan cukup dan tidak perlu membedakan
  // "dimatikan operator" dari "backend sedang bermasalah" ke pelanggan.
  if (!data.enabled) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Ticket}
          eyebrow="Layanan Tambahan"
          title="Voucher Hotspot"
        />
        <EmptyState
          icon={PowerOff}
          title="Pembelian voucher belum tersedia"
          description="Layanan ini belum diaktifkan untuk lokasi Anda. Hubungi admin lewat WhatsApp jika Anda membutuhkan voucher hotspot."
        />
      </div>
    );
  }

  return (
    <VoucherView
      packages={data.packages}
      initialHistory={data.history}
      qrisFeeRate={data.qrisFeeRate}
      notifyPhone={data.notifyPhone}
      multiBuy={data.multiBuy}
    />
  );
}
