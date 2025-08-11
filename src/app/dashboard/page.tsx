import { getSSIDInfo, getCustomerInfo } from "./actions";
import ClientView from "./client.view";
export const dynamic = 'force-dynamic'
export default async function Page() {
    const [ssidInfo, customerInfo] = await Promise.all([
        getSSIDInfo(),
        getCustomerInfo()
    ]);
    return (
        <div className="w-full min-h-[100dvh]">
            <ClientView ssidInfo={ssidInfo!} customerInfo={customerInfo}/>
        </div>
    );
}