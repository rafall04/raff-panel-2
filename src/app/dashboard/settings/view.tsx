"use client";

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { rebootRouter } from '../actions';
import { Settings, LogOut, Power, MessageSquareWarning, Check, X, LoaderCircle } from 'lucide-react';

export default function SettingsView() {
    const [isLoadingReboot, setIsLoadingReboot] = useState(false);

    const handleLogout = () => {
        signOut({ callbackUrl: '/login' });
    };

    const handleReboot = async () => {
        setIsLoadingReboot(true);
        try {
            await rebootRouter();
            // The success/error state of this is not currently communicated to the user,
            // but the router will eventually reboot.
        } catch (error) {
            console.error("Failed to reboot router:", error);
        } finally {
            setIsLoadingReboot(false);
            (document.getElementById("reboot_confirmation_modal") as HTMLDialogElement)?.close();
        }
    };

    const openRebootModal = () => {
        (document.getElementById("reboot_confirmation_modal") as HTMLDialogElement)?.showModal();
    };

    return (
        <div>
            <dialog id="reboot_confirmation_modal" className="modal">
                <div className="modal-box bg-white/10 backdrop-blur-lg border border-white/20">
                    <h3 className="font-bold text-lg">Are you sure?</h3>
                    <p className="py-4">The router will restart. This may take a few minutes.</p>
                    <div className="modal-action">
                        <button onClick={handleReboot} className="btn btn-error" disabled={isLoadingReboot}>
                            {isLoadingReboot ? <LoaderCircle className="animate-spin"/> : <Check className="mr-2"/>}
                            Confirm Reboot
                        </button>
                        <form method="dialog">
                            <button className="btn"><X className="mr-2"/>Cancel</button>
                        </form>
                    </div>
                </div>
            </dialog>

            <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
                <Settings className="mr-3"/>
                Settings & Actions
            </h1>

            <div className="space-y-4">
                <div className="card bg-white/10 border border-white/20">
                    <div className="card-body">
                        <h2 className="card-title text-white">Actions</h2>
                        <p className="text-sm text-gray-400 mb-4">Perform actions on your account or device.</p>
                        <div className="card-actions justify-start flex-col sm:flex-row gap-4">
                            <label htmlFor="report_modal_toggle" className="btn btn-outline text-white hover:bg-primary w-full sm:w-auto">
                                <MessageSquareWarning size={16} className="mr-2"/> Report an Issue
                            </label>
                            <button onClick={openRebootModal} className="btn btn-outline btn-warning text-white hover:bg-amber-600 w-full sm:w-auto">
                                <Power size={16} className="mr-2"/> Reboot Router
                            </button>
                            <button onClick={handleLogout} className="btn btn-outline btn-error text-white hover:bg-red-600 w-full sm:w-auto sm:ml-auto">
                                <LogOut size={16} className="mr-2"/> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
