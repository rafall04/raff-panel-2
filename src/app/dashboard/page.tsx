import { getSSIDInfo, getCustomerInfo } from "./actions";
import ClientView from "./client.view";
export const dynamic = 'force-dynamic'
export default async function Page() {
    const [ssidInfo, customerInfo] = await Promise.all([
        getSSIDInfo(),
        getCustomerInfo()
    ]);

    if (!ssidInfo) {
        return (
            <div className="w-full min-h-[100dvh] flex items-center justify-center p-4">
                <div className="alert alert-error max-w-lg">
                    <span>
                        Error: Could not retrieve device information. Please ensure your environment configuration (e.g., GENIEACS_URL) is correct and try again later.
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-[100dvh]">
            <ClientView ssidInfo={ssidInfo} customerInfo={customerInfo}/>
        </div>
    );
}