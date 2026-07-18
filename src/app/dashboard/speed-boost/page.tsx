import { getCustomerInfo, getSpeedRequestAwaitingProof } from "../actions";
import SpeedBoostView from "./view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

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
      <div className="w-full flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Could not retrieve your customer information. Please try again
            later.
          </AlertDescription>
        </Alert>
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
