import { getAvailablePackages, getCustomerInfo } from "../actions";
import SettingsView from "./view";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    // Fetch all data concurrently for efficiency
    const [packages, customerInfo] = await Promise.all([
        getAvailablePackages(),
        getCustomerInfo()
    ]);

    // We need customer info, so it's a critical dependency
    if (!customerInfo) {
        return (
            <div className="w-full text-center p-4">
                <p className="text-lg text-red-400">Could not retrieve your customer information.</p>
                <p className="text-sm text-gray-400">Please try again later.</p>
            </div>
        );
    }

    return <SettingsView allPackages={packages} currentCustomerInfo={customerInfo} />;
}
