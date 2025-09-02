"use client";

import { useState, useEffect } from "react";
import type { SSIDInfo, CustomerInfo, DashboardStatus } from "./actions";
import { getSSIDInfo, refreshObject } from "./actions";

import CustomerView from "./customer.view";
import StatusView from "./status.view";
import { RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import AssociatedDevicesTable from "./associated-devices-table";
import AnnouncementDisplay from "./announcement-display";
import NewsDisplay from "./news-display";


export default function View({ ssidInfo: initialSsidInfo, customerInfo, dashboardStatus }: { ssidInfo: SSIDInfo, customerInfo: CustomerInfo | null, dashboardStatus: DashboardStatus }) {
    const [ssidInfo, setSSIDInfo] = useState<SSIDInfo>(initialSsidInfo);
    const [loading, setLoading] = useState<boolean>(false);

    // Effect for real-time data refresh
    useEffect(() => {
        const intervalId = setInterval(() => {
            if (!loading) {
                refreshSsidInfo();
            }
        }, 300000); // Refresh every 5 minutes

        return () => clearInterval(intervalId);
    }, [loading]);

    const refreshSsidInfo = async () => {
        setLoading(true);
        toast.info("Refreshing data...");
        try {
            await refreshObject();
            const newSsidInfo = await getSSIDInfo();
            if (newSsidInfo) {
                setSSIDInfo(newSsidInfo);
                toast.success("Data refreshed successfully!");
            }
        } catch (error) {
            console.error("Failed to refresh SSID info:", error);
            toast.error("Failed to refresh data.");
        } finally {
            setLoading(false);
        }
    };

    const isOnline = new Date(ssidInfo.lastInform).getTime() > (new Date().getTime() - 86700000);
    const allDevices = ssidInfo.ssid.flatMap(s => s.associatedDevices);

    return (
        <div className="space-y-6">
            <AnnouncementDisplay />
            {/* Top Row: Main Status and Customer Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Network Status</CardTitle>
                            <CardDescription>Hello, {customerInfo?.name || "Customer"}!</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={refreshSsidInfo} disabled={loading}>
                            <RefreshCw size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`}/> Refresh
                        </Button>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-4 border rounded-lg">
                            <h4 className="text-sm font-semibold text-muted-foreground">Status</h4>
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-glow-green' : 'bg-red-500 animate-glow-red'}`}></div>
                                <p className="text-lg font-bold">{isOnline ? 'Online' : 'Offline'}</p>
                            </div>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <h4 className="text-sm font-semibold text-muted-foreground">Uptime</h4>
                            <p className="text-lg font-bold mt-1">{ssidInfo.uptime || "N/A"}</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <h4 className="text-sm font-semibold text-muted-foreground">Connected Devices</h4>
                            <p className="text-lg font-bold mt-1">{allDevices.length}</p>
                        </div>
                         <div className="p-4 border rounded-lg">
                            <h4 className="text-sm font-semibold text-muted-foreground">Active Boost</h4>
                            <p className="text-lg font-bold mt-1">{dashboardStatus.activeBoost?.profile || 'None'}</p>
                        </div>
                    </CardContent>
                </Card>
                <CustomerView customerInfo={customerInfo} />
            </div>

            {/* Second Row: Status Overview and Devices Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Associated Devices</CardTitle>
                            <CardDescription>A list of devices currently connected to your network.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AssociatedDevicesTable devices={allDevices} />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                     <StatusView status={dashboardStatus} />
                </div>
            </div>

            {/* News and Promotions Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Berita & Promo</CardTitle>
                </CardHeader>
                <CardContent>
                    <NewsDisplay />
                </CardContent>
            </Card>
        </div>
    );
}
