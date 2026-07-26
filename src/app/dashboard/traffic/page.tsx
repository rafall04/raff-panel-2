import {
  getCustomerTrafficUsage,
  getCustomerTrafficUsageStatus,
} from "../actions";
import TrafficView from "./view";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Activity, EyeOff } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TrafficPage() {
  const status = await getCustomerTrafficUsageStatus();
  const usageEnabled =
    status.success &&
    (status.data?.usageEnabled === true || status.data?.enabled === true);
  const liveEnabled = status.success && status.data?.liveEnabled === true;

  if (!usageEnabled) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Activity}
          eyebrow="Pemakaian"
          title="Pemakaian Traffic"
        />
        <EmptyState
          icon={EyeOff}
          title="Fitur belum diaktifkan"
          description="Pemantauan pemakaian data belum diaktifkan oleh admin untuk akun Anda."
        />
      </div>
    );
  }

  const usage = await getCustomerTrafficUsage();
  return <TrafficView usage={usage} liveEnabled={liveEnabled} />;
}
