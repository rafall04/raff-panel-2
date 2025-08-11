"use client";

import { useState } from "react";
import type { SSIDInfo } from "../actions";
import Form from "../client.form"; // Re-using the existing form component
import { Wifi, ChevronDown } from 'lucide-react';

const allowSsid = ["1", "5"];

export default function WifiView({ ssidInfo: initialSsidInfo }: { ssidInfo: SSIDInfo }) {
    const [ssidInfo] = useState<SSIDInfo>(initialSsidInfo);
    const [selectedSSID, setSelectedSSID] = useState<string>(ssidInfo.ssid[0].id);
    const [syncedSsids, setSyncedSsids] = useState<string[]>(allowSsid);

    // This function will be needed by the form, but the refresh logic might need to be passed down
    // For now, an empty function is fine as a placeholder. The parent layout will handle refresh.
    const refreshSsidInfo = () => {
        // In a full refactor, this would likely be a global state or passed via context.
        // For now, we are just moving the UI.
        window.location.reload(); // Simple refresh for now
    };

    return (
        <div className="card bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
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
    );
}
