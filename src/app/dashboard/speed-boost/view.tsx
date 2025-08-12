"use client";

import { useState } from "react";
import type { BoostPackage, CustomerInfo } from "../actions";
import { requestSpeedBoost } from "../actions";
import { ArrowRight, Check, LoaderCircle, Rocket, X } from "lucide-react";

// Helper to format currency
const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
});

// Helper to format duration keys
const formatDuration = (durationKey: string) => {
    return durationKey.replace('_', ' ');
};

export default function SpeedBoostView({
    allPackages,
    currentCustomerInfo
}: {
    allPackages: BoostPackage[];
    currentCustomerInfo: CustomerInfo;
}) {
    const [selectedBoost, setSelectedBoost] = useState<{ targetPackage: BoostPackage; duration: string; price: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState<{ message: string; success: boolean } | null>(null);

    const currentPrice = parseFloat(currentCustomerInfo.monthlyBill.toString());
    const availableUpgrades = allPackages.filter(p => parseFloat(p.price) > currentPrice);

    const handleBoostClick = (targetPackage: BoostPackage, duration: string, price: string) => {
        setSelectedBoost({ targetPackage, duration, price });
        (document.getElementById("confirmation_modal") as HTMLDialogElement)?.showModal();
    };

    const handleConfirmBoost = async () => {
        if (!selectedBoost) return;

        setIsLoading(true);
        setNotification(null);

        const result = await requestSpeedBoost(selectedBoost.targetPackage.name, selectedBoost.duration);

        setNotification(result);
        setIsLoading(false);
        setSelectedBoost(null);
        (document.getElementById("confirmation_modal") as HTMLDialogElement)?.close();

        // Auto-hide notification after 5 seconds
        setTimeout(() => setNotification(null), 5000);
    };

    return (
        <div>
            {notification && (
                <div className="toast toast-top toast-center z-[999]">
                    <div className={`alert ${notification.success ? 'alert-success' : 'alert-error'}`}>
                        <span>{notification.message}</span>
                    </div>
                </div>
            )}

            <dialog id="confirmation_modal" className="modal">
                <div className="modal-box bg-white/10 backdrop-blur-lg border border-white/20">
                    <h3 className="font-bold text-lg text-white">Confirm Speed Boost</h3>
                    {selectedBoost && (
                        <div className="py-4 text-white/80">
                            <p>You are about to activate a speed boost:</p>
                            <ul className="list-disc list-inside my-2">
                                <li><b>Target Speed:</b> {selectedBoost.targetPackage.profile}</li>
                                <li><b>Duration:</b> {formatDuration(selectedBoost.duration)}</li>
                                <li><b>Price:</b> {currencyFormatter.format(parseFloat(selectedBoost.price))}</li>
                            </ul>
                            <p>Are you sure you want to proceed?</p>
                        </div>
                    )}
                    <div className="modal-action">
                        <button onClick={handleConfirmBoost} className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? <LoaderCircle className="animate-spin"/> : <Check className="mr-2"/>}
                            Confirm & Activate
                        </button>
                        <form method="dialog">
                            <button className="btn"><X className="mr-2"/>Cancel</button>
                        </form>
                    </div>
                </div>
            </dialog>

            <h1 className="text-3xl font-bold text-white mb-2 flex items-center"><Rocket className="mr-3"/>Speed on Demand</h1>
            <p className="text-gray-400 mb-6">Upgrade your speed temporarily to handle heavy tasks.</p>

            <div className="space-y-4 mb-8">
                <h2 className="text-xl font-semibold text-white">Your Current Package</h2>
                <div className="card card-compact bg-white/5 border border-white/10">
                    <div className="card-body">
                        <h3 className="card-title text-primary">{currentCustomerInfo.packageName}</h3>
                        <p>{currencyFormatter.format(currentCustomerInfo.monthlyBill)} / month</p>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-xl font-semibold text-white mb-4">Available Speed Boosts</h2>
                {availableUpgrades.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {availableUpgrades.map(pkg => (
                            <div key={pkg.name} className="card bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl">
                                <div className="card-body">
                                    <h3 className="card-title text-white">Boost to {pkg.profile}</h3>
                                    <p className="text-sm text-gray-400">Temporarily upgrade to the speed of {pkg.name}</p>
                                    <div className="space-y-2 mt-4">
                                        {Object.entries(pkg.speedBoostPrices).map(([duration, price]) => (
                                            <button
                                                key={duration}
                                                onClick={() => handleBoostClick(pkg, duration, price)}
                                                className="btn btn-outline btn-primary w-full justify-between group"
                                            >
                                                <span>Boost for {formatDuration(duration)} - {currencyFormatter.format(parseFloat(price))}</span>
                                                <ArrowRight className="group-hover:translate-x-1 transition-transform"/>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-lg text-gray-300">You are already on the highest tier package.</p>
                        <p className="text-sm text-gray-500">No speed boosts available.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
