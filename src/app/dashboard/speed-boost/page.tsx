import { getBoostPackages, getCustomerInfo } from "../actions";
import SpeedBoostView from "./view";

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
            <div className="w-full text-center p-4">
                <p className="text-lg text-red-400">Could not retrieve your customer information.</p>
                <p className="text-sm text-gray-400">Please try again later.</p>
            </div>
        );
    }

    return <SpeedBoostView allPackages={packages} currentCustomerInfo={customerInfo} />;
}
