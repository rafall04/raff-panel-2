import { getWifiPageData } from "../actions";
import WifiView from "./view";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Router, Wifi } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WifiPage() {
  const ssidInfo = await getWifiPageData();

  if (!ssidInfo) {
    // Keeps the page header so the customer still knows where they are, and
    // stays in Indonesian like the rest of the portal — this used to be a raw
    // English "Error" alert about environment configuration.
    return (
      <div className="space-y-6">
        <PageHeader icon={Wifi} eyebrow="Jaringan" title="Kelola WiFi" />
        <EmptyState
          icon={Router}
          title="Data perangkat belum bisa ditampilkan"
          description="Kami sedang tidak bisa menghubungi router Anda. Coba muat ulang halaman ini beberapa saat lagi, atau hubungi admin lewat WhatsApp bila terus berulang."
        />
      </div>
    );
  }

  return <WifiView ssidInfo={ssidInfo} />;
}
