"use client";

import { useState, useEffect } from "react";
import type { SSIDInfo, CustomerInfo } from "./actions";
import { getSSIDInfo, rebootRouter, refreshObject } from "./actions";
import { signOut } from "next-auth/react";

import Form from "./client.form";
import CustomerView from "./customer.view";
import ChartsView from "./charts.view";
import { Wifi, Power, RefreshCw, LogOut, ChevronDown, Check, X, BarChart2 } from 'lucide-react';

const allowSsid = ["1", "5"];

export default function View({ ssidInfo: initialSsidInfo, customerInfo }: { ssidInfo: SSIDInfo, customerInfo: CustomerInfo | null }) {
    const [ssidInfo, setSSIDInfo] = useState<SSIDInfo>(initialSsidInfo);
    const [selectedSSID, setSelectedSSID] = useState<string>(ssidInfo.ssid[0].id);
    const [syncedSsids, setSyncedSsids] = useState<string[]>(allowSsid);
    const [loading, setLoading] = useState<boolean>(false);
    const [modalState, setModalState] = useState<{ action: 'reboot' | 'logout', description: string, text: string } | null>(null);

    // Effect for real-time data refresh
    useEffect(() => {
        const intervalId = setInterval(() => {
            refreshSsidInfo();
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(intervalId); // Cleanup on component unmount
    }, []);

    const refreshSsidInfo = async () => {
        setLoading(true);
        await refreshObject();
        const newSsidInfo = await getSSIDInfo();
        setSSIDInfo(newSsidInfo!);
        setLoading(false);
    };

    const handleReboot = async () => {
        setLoading(true);
        try {
            await rebootRouter();
        } catch (error) {
            console.error(error);
        } finally {
            await refreshSsidInfo();
            setLoading(false);
        }
    };

    const handleLogout = () => {
        signOut({
            redirect: true,
            callbackUrl: "/login"
        });
    };

    const openModal = (action: 'reboot' | 'logout', description: string, text: string) => {
        setModalState({ action, description, text });
        (document.getElementById("confirmation_modal") as HTMLDialogElement)?.showModal();
    };

    const confirmModalAction = () => {
        if (modalState?.action === 'reboot') {
            handleReboot();
        } else if (modalState?.action === 'logout') {
            handleLogout();
        }
        setModalState(null);
        (document.getElementById("confirmation_modal") as HTMLDialogElement)?.close();
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

            <dialog id="confirmation_modal" className="modal">
                <div className="modal-box bg-white/10 backdrop-blur-lg border border-white/20">
                    <h3 className="font-bold text-lg">Are You Sure?</h3>
                    <p className="py-4">{modalState?.text}</p>
                    <div className="modal-action">
                        <button onClick={confirmModalAction} className="btn btn-error"><Check className="mr-2"/>Confirm</button>
                        <form method="dialog">
                            <button className="btn"><X className="mr-2"/>Cancel</button>
                        </form>
                    </div>
                </div>
            </dialog>

            <div className="navbar bg-base-100/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
                <div className="navbar-start">
                    <a className="btn btn-ghost text-xl text-white">RAF PANEL</a>
                </div>
                <div className="navbar-end">
                    <button className="btn btn-ghost text-white" onClick={() => openModal('logout', 'Logout', 'You will be logged out.')}>
                        <LogOut size={20}/>
                        Logout
                    </button>
                </div>
            </div>

            <div className="container mx-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                    {/* Customer Info Card */}
                    <div className="xl:col-span-1">
                        <CustomerView customerInfo={customerInfo} />
                    </div>

                    {/* Status Card */}
                    <div className="card bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl xl:col-span-2">
                        <div className="card-body">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="card-title text-white">Device Status</h2>
                                    <p className="text-sm text-gray-400">Uptime: {ssidInfo.uptime || "Not Available"}</p>
                                    <p className="text-sm text-gray-400">Last Update: {new Date(ssidInfo.lastInform).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400 animate-glow-green' : 'bg-red-500 animate-glow-red'}`}></div>
                                    <span className="text-white">{isOnline ? 'Online' : 'Offline'}</span>
                                </div>
                            </div>
                            <div className="card-actions justify-end mt-4">
                                <button className="btn btn-outline text-white hover:bg-primary" onClick={refreshSsidInfo} disabled={loading}>
                                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/> Refresh
                                </button>
                                <button className="btn btn-error text-white" onClick={() => openModal('reboot', 'Reboot', 'The router will restart. This may take a few minutes.')} disabled={loading}>
                                    <Power size={16}/> Reboot Router
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SSID Management Card */}
                    <div className="card bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl md:col-span-2 xl:col-span-3">
                        <div className="card-body">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
                                <h2 className="card-title text-white mb-2 sm:mb-0"><Wifi className="mr-2"/>SSID Management</h2>
                                <div className="flex items-center gap-4">
                                    <div className="form-control">
                                        <label className="label cursor-pointer gap-2">
                                            <span className="label-text text-gray-300">Sync SSID</span>
                                            <input
                                                type="checkbox"
                                                className="toggle toggle-primary"
                                                checked={syncedSsids.length > 0}
                                                onChange={(e) => setSyncedSsids(e.target.checked ? allowSsid : [])}
                                            />
                                        </label>
                                    </div>
                                    <div className="dropdown dropdown-bottom dropdown-end">
                                        <div tabIndex={0} role="button" className={`btn btn-outline text-white ${syncedSsids.length > 0 ? 'btn-disabled' : ''}`}>
                                            {ssidInfo.ssid.find(v => v.id == selectedSSID)?.name || ssidInfo.ssid[0].name}
                                            <ChevronDown size={16}/>
                                        </div>
                                        <ul tabIndex={0} className="dropdown-content menu bg-base-200 rounded-box z-[1] w-52 p-2 shadow">
                                            {ssidInfo.ssid.map((v, i) => (
                                                <li key={i} onClick={() => setSelectedSSID(v.id)}>
                                                    <button>{v.name}</button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <Form ssid={ssidInfo!.ssid} selectedSsid={selectedSSID} syncedSsids={syncedSsids} refreshSsidInfo={refreshSsidInfo}/>
                        </div>
                    </div>

                    {/* Associated Devices Chart Card */}
                    <div className="card bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl md:col-span-2 xl:col-span-3">
                        <div className="card-body">
                            <h1 className="card-title text-white flex items-center"><BarChart2 className="mr-2"/>Associated Devices Signal Strength</h1>
                            <ChartsView ssidInfo={ssidInfo} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
