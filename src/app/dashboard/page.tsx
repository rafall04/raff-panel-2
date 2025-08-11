import { getSSIDInfo } from "./actions";
import ClientView from "./client.view";
export const dynamic = 'force-dynamic'
export default async function Page() {
    const ssidInfo = await getSSIDInfo();
    return (
        <div className="w-full min-h-[100dvh]">
            <ClientView ssidInfo={ssidInfo!}/>
        </div>
    );
}