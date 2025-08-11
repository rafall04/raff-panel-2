"use client";

import { useState } from "react";
import type { SSIDInfo } from "./actions";
import { getSSIDInfo, rebootRouter, refreshObject } from "./actions";

import Form from "./client.form";
import { signOut } from "next-auth/react";
const allowSsid = ["1", "5"];

export default function View({ ssidInfo: initialSsidInfo }: { ssidInfo: SSIDInfo }) {
    const [ssidInfo, setSSIDInfo] = useState<SSIDInfo>(initialSsidInfo);
    const [selectedSSID, setSelectedSSID] = useState<string>(ssidInfo.ssid[0].id);
    const [syncedSsids, setSyncedSsids] = useState<string[]>(allowSsid);
    const [loading, setLoading] = useState<boolean>(false);
    const [modalState, setModalState] = useState<{ action: 'reboot' | 'logout', description: string, text: string } | null>(null);

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
        (document.getElementById("confirmation_modal") as HTMLInputElement).checked = true;
    };

    const confirmModalAction = () => {
        if (modalState?.action === 'reboot') {
            handleReboot();
        } else if (modalState?.action === 'logout') {
            handleLogout();
        }
        setModalState(null);
    };

    return (
        <>
            {loading && (
                <div className="toast toast-top toast-start z-[999]">
                    <div className="alert alert-info">
                        <span>Loading...</span>
                    </div>
                </div>
            )}
            <input type="checkbox" id="confirmation_modal" className="modal-toggle" />
            <div className="modal" role="dialog">
                <div className="modal-box">
                    <h3 className="text-lg font-bold">Are You Sure?</h3>
                    <p className="py-4">{modalState?.text}</p>
                    <div className="modal-action">
                        <label htmlFor="confirmation_modal" onClick={confirmModalAction} className="btn btn-error">Confirm</label>
                        <label htmlFor="confirmation_modal" className="btn">Cancel</label>
                    </div>
                </div>
            </div>
            <div className="navbar bg-base-100">
                <div className="navbar-start">
                    <a className="btn btn-ghost text-xl">RAF PANEL</a>
                </div>
                <div className="navbar-end">
                    <a className="btn" onClick={() => openModal('logout', 'Logout', 'You will be logged out.')}>Logout</a>
                </div>
            </div>
            <div className="container mx-auto pt-8 pb-4 px-6">
                <div className="flex flex-col sm:flex-row w-full sm:justify-between mb-1 sm:items-center">
                    <div className="form-control">
                        <label className="label cursor-pointer">
                            <span className="label-text mr-1">Sync SSID</span>
                            <input 
                                type="checkbox" 
                                className="toggle" 
                                checked={syncedSsids.length > 0} 
                                onChange={(e) => setSyncedSsids(e.target.checked ? allowSsid : [])} 
                            />
                        </label>
                    </div>
                    <div className="dropdown dropdown-bottom dropdown-end ml-auto">
                        <div tabIndex={0} role="button" className={`btn m-1 ${syncedSsids.length > 0 ? 'btn-disabled' : ''}`}>
                            {ssidInfo.ssid.find(v => v.id == selectedSSID)?.name || ssidInfo.ssid[0].name}
                            <i>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                    <path d="M12 16L6 10H18L12 16Z"></path>
                                </svg>
                            </i>
                        </div>
                        <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                            {ssidInfo.ssid.map((v, i) => (
                                <li key={i} onClick={() => setSelectedSSID(v.id)}>
                                    <button>{v.name}</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="card bg-base-100 w-full shrink-0 shadow-2xl mb-4">
                    <div className="card-body">
                        <div className="flex flex-wrap items-center justify-between">
                            <div className="">
                                <p>Status: <span className={"badge " + (new Date(ssidInfo.lastInform).getTime() > (new Date().getTime() - 86700000) ? 'badge-accent' : 'badge-ghost')}>{new Date(ssidInfo.lastInform).getTime() > (new Date().getTime() - 86700000) ? 'Online' : 'No update in 24H'}</span></p>
                                <p>Uptime: {ssidInfo.uptime || "Not Available"}</p>
                                <p>Last Information: {new Date(ssidInfo.lastInform).toLocaleDateString()} {new Date(ssidInfo.lastInform).toLocaleTimeString()}</p>
                            </div>
                            <div className="flex gap-1 ml-auto mt-2 sm:mt-0">
                                <button className="btn btn-info" onClick={refreshSsidInfo}>
                                    Refresh
                                </button>
                                <label className="btn btn-error" onClick={() => openModal('reboot', 'Reboot', 'The router will restart after you confirm.')}>Reboot</label>     
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card bg-base-100 w-full shrink-0 shadow-2xl mb-4">
                    <Form ssid={ssidInfo!.ssid} selectedSsid={selectedSSID} syncedSsids={syncedSsids} refreshSsidInfo={refreshSsidInfo}/>            
                </div>
                <div className="card bg-base-100 w-full shrink-0 shadow-2xl">
                    <div className="card-body">
                        <h1 className="card-title">Associated Devices</h1>
                        <div className="overflow-x-auto">
                            <table className="table w-full">
                                <thead>
                                    <tr>
                                        <th>IP Address</th>
                                        <th>MAC Address</th>
                                        <th>Host Name</th>
                                        <th>Signal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(syncedSsids.length > 0 ? ssidInfo.ssid.filter(v => allowSsid.includes(v.id)) : [ssidInfo.ssid.find(v => v.id == selectedSSID) || ssidInfo.ssid[0]]).flatMap(v => v.associatedDevices).map((v, i) => (
                                        <tr key={i}>
                                            <td>{v.ip || "Not Available"}</td>
                                            <td>{v.mac || "Not Available"}</td>
                                            <td>{v.hostName || "Not Available"}</td>
                                            <td>{v.signal || "Not Available"}</td>
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
