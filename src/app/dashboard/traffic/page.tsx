import {
  getCustomerTrafficUsage,
  getCustomerTrafficUsageStatus,
} from "../actions";
import TrafficView from "./view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function TrafficPage() {
  const status = await getCustomerTrafficUsageStatus();
  const usageEnabled =
    status.success &&
    (status.data?.usageEnabled === true || status.data?.enabled === true);
  const liveEnabled = status.success && status.data?.liveEnabled === true;

  if (!usageEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pemakaian Traffic</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Fitur pemakaian traffic belum diaktifkan oleh admin.
        </CardContent>
      </Card>
    );
  }

  const usage = await getCustomerTrafficUsage();
  return <TrafficView usage={usage} liveEnabled={liveEnabled} />;
}
