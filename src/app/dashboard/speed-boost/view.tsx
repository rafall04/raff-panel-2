"use client";

import { useState } from "react";
import type { BoostPackage, CustomerInfo } from "../actions";
import { requestSpeedBoost } from "../actions";
import { ArrowRight, Check, LoaderCircle, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from 'sonner';

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
    const [isConfirmOpen, setConfirmOpen] = useState(false);

    const currentPrice = parseFloat(currentCustomerInfo.monthlyBill.toString());
    const availableUpgrades = allPackages.filter(p => parseFloat(p.price) > currentPrice);

    const handleBoostClick = (targetPackage: BoostPackage, duration: string, price: string) => {
        setSelectedBoost({ targetPackage, duration, price });
        setConfirmOpen(true);
    };

    const handleConfirmBoost = async () => {
        if (!selectedBoost) return;

        setIsLoading(true);
        const promise = requestSpeedBoost(selectedBoost.targetPackage.name, selectedBoost.duration);

        toast.promise(promise, {
            loading: 'Activating boost...',
            success: (result) => {
                setConfirmOpen(false);
                return result.message;
            },
            error: (err) => err.message,
            finally: () => {
                setIsLoading(false);
                setSelectedBoost(null);
            }
        });
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center"><Rocket className="mr-3"/>Speed on Demand</h1>
            <p className="text-muted-foreground mb-6">Upgrade your speed temporarily to handle heavy tasks.</p>

            <div className="space-y-4 mb-8">
                <h2 className="text-xl font-semibold">Your Current Package</h2>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-primary">{currentCustomerInfo.packageName}</CardTitle>
                        <CardDescription>{currencyFormatter.format(currentCustomerInfo.monthlyBill)} / month</CardDescription>
                    </CardHeader>
                </Card>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Available Speed Boosts</h2>
                {availableUpgrades.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableUpgrades.map(pkg => (
                            <Card key={pkg.name}>
                                <CardHeader>
                                    <CardTitle>Boost to {pkg.profile}</CardTitle>
                                    <CardDescription>Temporarily upgrade to the speed of {pkg.name}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {Object.entries(pkg.speedBoostPrices).map(([duration, price]) => (
                                        <Button
                                            key={duration}
                                            onClick={() => handleBoostClick(pkg, duration, price)}
                                            variant="outline"
                                            className="w-full justify-between group"
                                        >
                                            <span>Boost for {formatDuration(duration)} - {currencyFormatter.format(parseFloat(price))}</span>
                                            <ArrowRight className="group-hover:translate-x-1 transition-transform h-4 w-4"/>
                                        </Button>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 border rounded-lg">
                        <p className="text-lg text-muted-foreground">You are already on the highest tier package.</p>
                        <p className="text-sm text-muted-foreground">No speed boosts available.</p>
                    </div>
                )}
            </div>

            <Dialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Speed Boost</DialogTitle>
                        {selectedBoost && (
                            <DialogDescription>
                                You are about to activate a boost to <b className="text-primary">{selectedBoost.targetPackage.profile}</b> for {formatDuration(selectedBoost.duration)} at a cost of <b className="text-primary">{currencyFormatter.format(parseFloat(selectedBoost.price))}</b>.
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmBoost} disabled={isLoading}>
                            {isLoading ? <LoaderCircle className="animate-spin mr-2"/> : <Check className="mr-2"/>}
                            Confirm & Activate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
