import { getBoostPackages, getCustomerInfo } from "../actions";
import SpeedBoostView from "./view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function SpeedBoostPage() {
    // Fetch all data concurrently for efficiency
    const [packages, customerInfo] = await Promise.all([
        getBoostPackages(),
        getCustomerInfo()
    ]);

    // We need customer info to filter packages, so it's a critical dependency
    if (!customerInfo) {
        return (
            <div className="w-full flex items-center justify-center p-4">
                <Alert variant="destructive" className="max-w-lg">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        Could not retrieve your customer information. Please try again later.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return <SpeedBoostView allPackages={packages} currentCustomerInfo={customerInfo} />;
}
