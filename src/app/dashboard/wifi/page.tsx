import { getSSIDInfo } from "../actions";
import WifiView from "./view"; // This will be the new client view

export const dynamic = 'force-dynamic';

export default async function WifiPage() {
    const ssidInfo = await getSSIDInfo();

    if (!ssidInfo) {
        return (
            <div className="w-full min-h-[100dvh] flex items-center justify-center p-4">
                <div className="alert alert-error max-w-lg">
                    <span>
                        Error: Could not retrieve device information.
                    </span>
                </div>
            </div>
        );
    }

    return <WifiView ssidInfo={ssidInfo} />;
}
