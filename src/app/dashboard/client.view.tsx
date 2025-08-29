"use client";

import { useState, useEffect } from "react";
import type { SSIDInfo, CustomerInfo, DashboardStatus } from "./actions";
import { getSSIDInfo, refreshObject } from "./actions";

import CustomerView from "./customer.view";
import SignalStrengthIcon from "./SignalStrengthIcon";
import StatusView from "./status.view";
import { RefreshCw, Users } from 'lucide-react';

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
        try {
            await refreshObject();
            const newSsidInfo = await getSSIDInfo();
            if (newSsidInfo) {
                setSSIDInfo(newSsidInfo);
            }
        } catch (error) {
            console.error("Failed to refresh SSID info:", error);
        } finally {
            setLoading(false);
        }
    };

    const isOnline = new Date(ssidInfo.lastInform).getTime() > (new Date().getTime() - 86700000);

    return (
        <>
            {loading && (
                <div className="toast toast-top toast-center z-[999]">
                    <div className="alert alert-info bg-primary text-white">
                        <RefreshCw className="animate-spin" />
                        <span>Loading...</span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                <StatusView status={dashboardStatus} />

                {/* Customer Info Card */}
                <div className="xl:col-span-1">
                    <CustomerView customerInfo={customerInfo} />
                </div>

                {/* Status Card */}
                <div className="card bg-white/10 border border-white/20 shadow-2xl xl:col-span-2">
                    <div className="card-body">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="card-title text-white">Device Status</h2>
                                <p className="text-sm text-gray-400">Uptime: {ssidInfo.uptime || "Not Available"}</p>
                                <p className="text-sm text-gray-400">Last Update: {new Date(ssidInfo.lastInform).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-500'}`}></div>
                                <span className="text-white">{isOnline ? 'Online' : 'Offline'}</span>
                            </div>
                        </div>
                        <div className="card-actions justify-end mt-4">
                            <button className="btn btn-outline text-white hover:bg-primary" onClick={refreshSsidInfo} disabled={loading}>
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/> Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Associated Devices Table Card */}
                <div className="card bg-white/10 border border-white/20 shadow-2xl md:col-span-2 xl:col-span-3">
                    <div className="card-body">
                        <h1 className="card-title text-white flex items-center"><Users className="mr-2"/>Associated Devices</h1>
                        <div className="overflow-x-auto">
                            <table className="table w-full">
                                <thead className="text-white/80">
                                    <tr>
                                        <th className="bg-transparent">Host Name</th>
                                        <th className="bg-transparent">IP Address</th>
                                        <th className="bg-transparent">MAC Address</th>
                                        <th className="bg-transparent">Signal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ssidInfo.ssid.flatMap(s => s.associatedDevices).map((device, i) => (
                                        <tr key={i} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                                            <td>{device.hostName || "N/A"}</td>
                                            <td>{device.ip || "N/A"}</td>
                                            <td>{device.mac || "N/A"}</td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <SignalStrengthIcon signalDbm={device.signal ? parseInt(device.signal.replace(' dBm', '')) : null} />
                                                    <span>{device.signal || "N/A"}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
