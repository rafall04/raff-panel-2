"use client";

import { useState, useEffect } from "react";
import type { SSIDInfo, CustomerInfo, DashboardStatus } from "./actions";
import { getSSIDInfo, refreshObject } from "./actions";

import CustomerView from "./customer.view";
import StatusView from "./status.view";
import { RefreshCw, BarChart2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    CartesianGrid
} from 'recharts';

// New component for the device chart
const AssociatedDevicesChart = ({ devices }: { devices: SSIDInfo['ssid'][0]['associatedDevices'] }) => {
    const chartData = devices.map(device => ({
        name: device.hostName || device.mac || "Unknown Device",
        signal: device.signal ? parseInt(device.signal.replace(' dBm', '')) : 0,
    })).filter(device => device.signal < 0); // Filter out devices with no signal data

    if (chartData.length === 0) {
        return <p className="text-muted-foreground text-center py-8">No devices with signal data to display.</p>
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                <YAxis domain={[-100, 0]} label={{ value: 'Signal (dBm)', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))"
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Legend />
                <Bar dataKey="signal" name="Signal Strength (dBm)" fill="hsl(var(--primary))" />
            </BarChart>
        </ResponsiveContainer>
    );
};


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
                            <CardTitle className="flex items-center"><BarChart2 className="mr-2"/>Associated Devices Signal Strength</CardTitle>
                            <CardDescription>Signal strength of currently connected devices.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AssociatedDevicesChart devices={allDevices} />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                     <StatusView status={dashboardStatus} />
                </div>
            </div>
        </div>
    );
}
