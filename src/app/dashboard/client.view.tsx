"use client";

import { useState, useEffect } from "react";
import type { SSIDInfo, CustomerInfo, DashboardStatus } from "./actions";
import { getSSIDInfo, refreshObject } from "./actions";

import CustomerView from "./customer.view";
import SignalStrengthIcon from "./SignalStrengthIcon";
import StatusView from "./status.view";
import { RefreshCw, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

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

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

            <StatusView status={dashboardStatus} />

            {/* Customer Info Card */}
            <div className="xl:col-span-1">
                <CustomerView customerInfo={customerInfo} />
            </div>

            {/* Status Card */}
            <Card className="xl:col-span-2">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Device Status</CardTitle>
                            <CardDescription>Last Update: {new Date(ssidInfo.lastInform).toLocaleString()}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-glow-green' : 'bg-red-500 animate-glow-red'}`}></div>
                            <span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Uptime: {ssidInfo.uptime || "Not Available"}</p>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button variant="outline" onClick={refreshSsidInfo} disabled={loading}>
                        <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`}/> Refresh
                    </Button>
                </CardFooter>
            </Card>

            {/* Associated Devices Table Card */}
            <Card className="md:col-span-2 xl:col-span-3">
                <CardHeader>
                    <CardTitle className="flex items-center"><Users className="mr-2"/>Associated Devices</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Host Name</TableHead>
                                <TableHead>IP Address</TableHead>
                                <TableHead>MAC Address</TableHead>
                                <TableHead>Signal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ssidInfo.ssid.flatMap(s => s.associatedDevices).map((device, i) => (
                                <TableRow key={i}>
                                    <TableCell>{device.hostName || "N/A"}</TableCell>
                                    <TableCell>{device.ip || "N/A"}</TableCell>
                                    <TableCell>{device.mac || "N/A"}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <SignalStrengthIcon signalDbm={device.signal ? parseInt(device.signal.replace(' dBm', '')) : null} />
                                            <span>{device.signal || "N/A"}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
