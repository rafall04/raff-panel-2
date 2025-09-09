import { getSSIDInfo, getCustomerInfo } from "../actions";
import WifiView from "./view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function WifiPage() {
    const customerInfo = await getCustomerInfo();

    // Determine the list of allowed SSIDs. Use customer's config if available, otherwise default to ["1"].
    const allowedSsids = customerInfo?.allowed_ssids && customerInfo.allowed_ssids.length > 0
        ? customerInfo.allowed_ssids
        : ["1"];

    const ssidInfo = await getSSIDInfo(allowedSsids);

    if (!ssidInfo) {
        return (
            <div className="w-full flex items-center justify-center p-4">
                <Alert variant="destructive" className="max-w-lg">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        Could not retrieve device information. Please ensure your environment configuration is correct and try again later.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return <WifiView ssidInfo={ssidInfo} />;
}
