"use client";

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { rebootRouter, requestPackageChange, updateCredentials } from '../actions';
import type { CustomerInfo, Package } from '../actions';
import { Settings, LogOut, Power, MessageSquareWarning, Check, X, LoaderCircle, PackageCheck, ArrowRight, User, Lock, KeyRound } from 'lucide-react';

// Helper to format currency
const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
});

export default function SettingsView({
    allPackages,
    currentCustomerInfo
}: {
    allPackages: Package[];
    currentCustomerInfo: CustomerInfo;
}) {
    const [isLoadingReboot, setIsLoadingReboot] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [isChangeLoading, setIsChangeLoading] = useState(false);
    const [notification, setNotification] = useState<{ message: string; success: boolean } | null>(null);

    // State for credentials update
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [isCredentialUpdateLoading, setIsCredentialUpdateLoading] = useState(false);
    const [credentialNotification, setCredentialNotification] = useState<{ message: string; success: boolean } | null>(null);


    const availablePackages = allPackages.filter(p => p.name !== currentCustomerInfo.packageName);

    const handleUpdateCredentials = async (e: React.FormEvent) => {
        e.preventDefault();
        setCredentialNotification(null);

        if (newPassword !== confirmNewPassword) {
            setCredentialNotification({ message: "New passwords do not match!", success: false });
            return;
        }

        if (!currentPassword) {
            setCredentialNotification({ message: "Current password is required to make changes.", success: false });
            return;
        }

        if (!newUsername && !newPassword) {
            setCredentialNotification({ message: "You must provide either a new username or a new password.", success: false });
            return;
        }

        setIsCredentialUpdateLoading(true);

        try {
            const result = await updateCredentials(currentPassword, newUsername || undefined, newPassword || undefined);
            if (result.status === 200) {
                setCredentialNotification({ message: result.message || 'Credentials updated successfully!', success: true });
                setNewUsername('');
                setNewPassword('');
                setConfirmNewPassword('');
                setCurrentPassword('');
            } else {
                setCredentialNotification({ message: result.message || 'Failed to update credentials.', success: false });
            }
        } catch (error) {
            console.error("Failed to update credentials:", error);
            setCredentialNotification({ message: 'An unexpected error occurred.', success: false });
        } finally {
            setIsCredentialUpdateLoading(false);
            setTimeout(() => setCredentialNotification(null), 5000);
        }
    };

    const handleLogout = () => {
        signOut({ callbackUrl: '/login' });
    };

    const handleReboot = async () => {
        setIsLoadingReboot(true);
        try {
            await rebootRouter();
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

    const handleSelectPackage = (pkg: Package) => {
        setSelectedPackage(pkg);
        (document.getElementById("change_package_confirm_modal") as HTMLDialogElement)?.showModal();
    };

    const handleConfirmPackageChange = async () => {
        if (!selectedPackage) return;

        setIsChangeLoading(true);
        setNotification(null);

        const result = await requestPackageChange(selectedPackage.name);

        setNotification(result);
        setIsChangeLoading(false);

        // Close modals
        (document.getElementById("change_package_confirm_modal") as HTMLDialogElement)?.close();
        if (result.success) {
            (document.getElementById("change_package_list_modal") as HTMLDialogElement)?.close();
        }
        setSelectedPackage(null);

        // Auto-hide notification after 5 seconds
        setTimeout(() => setNotification(null), 5000);
    };

    const openPackageChangeModal = () => {
        setNotification(null);
        (document.getElementById("change_package_list_modal") as HTMLDialogElement)?.showModal();
    }

    return (
        <div>
            {notification && (
                <div className="toast toast-bottom toast-center z-[999]">
                    <div className={`alert ${notification.success ? 'alert-success' : 'alert-error'}`}>
                        <span>{notification.message}</span>
                    </div>
                </div>
            )}

            {/* Reboot Confirmation Modal */}
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

            {/* Package Change List Modal */}
            <dialog id="change_package_list_modal" className="modal">
                <div className="modal-box w-11/12 max-w-3xl bg-white/10 backdrop-blur-lg border border-white/20">
                    <h3 className="font-bold text-lg">Change Subscription Package</h3>
                    <p className="text-sm text-gray-400 mb-4">Select a new package. Changes will be reviewed by an admin.</p>

                    <div className="space-y-4">
                        {availablePackages.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {availablePackages.map(pkg => (
                                    <div key={pkg.name} className="card bg-white/5 border border-white/10">
                                        <div className="card-body">
                                            <h4 className="card-title text-white">{pkg.profile}</h4>
                                            <p className="text-primary font-bold">{currencyFormatter.format(parseFloat(pkg.price))} / month</p>
                                            <div className="card-actions justify-end">
                                                <button onClick={() => handleSelectPackage(pkg)} className="btn btn-primary btn-sm group">
                                                    Request Change <ArrowRight className="group-hover:translate-x-1 transition-transform"/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-400 py-4">No other packages are available at the moment.</p>
                        )}
                    </div>

                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn"><X className="mr-2"/>Close</button>
                        </form>
                    </div>
                </div>
            </dialog>

            {/* Package Change Confirmation Modal */}
            <dialog id="change_package_confirm_modal" className="modal">
                <div className="modal-box bg-white/10 backdrop-blur-lg border border-white/20">
                    <h3 className="font-bold text-lg text-white">Confirm Package Change</h3>
                    {selectedPackage && (
                        <div className="py-4 text-white/80">
                            <p>You are requesting to change your package to:</p>
                            <ul className="list-disc list-inside my-2">
                                <li><b>New Package:</b> {selectedPackage.name} ({selectedPackage.profile})</li>
                                <li><b>New Monthly Price:</b> {currencyFormatter.format(parseFloat(selectedPackage.price))}</li>
                            </ul>
                            <p className="text-sm text-amber-400">This request will be sent for admin approval.</p>
                        </div>
                    )}
                    <div className="modal-action">
                        <button onClick={handleConfirmPackageChange} className="btn btn-primary" disabled={isChangeLoading}>
                            {isChangeLoading ? <LoaderCircle className="animate-spin"/> : <Check className="mr-2"/>}
                            Confirm Request
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

            <div className="space-y-6">
                <div className="card bg-white/10 border border-white/20">
                    <div className="card-body">
                        <h2 className="card-title text-white">Your Subscription</h2>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-primary">{currentCustomerInfo.packageName}</p>
                                <p className="text-gray-300">{currencyFormatter.format(currentCustomerInfo.monthlyBill)} / month</p>
                            </div>
                            <button onClick={openPackageChangeModal} className="btn btn-outline btn-primary">
                                <PackageCheck size={16} className="mr-2"/> Change Package
                            </button>
                        </div>
                    </div>
                </div>

                {/* Account Credentials Card */}
                <div className="card bg-white/10 border border-white/20">
                    <div className="card-body">
                        <h2 className="card-title text-white">Account Credentials</h2>
                        <p className="text-sm text-gray-400 mb-4">Update your username or password. Requires current password for verification.</p>
                        <form onSubmit={handleUpdateCredentials} className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text text-white/70">Current Password (Required)</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="password"
                                        placeholder="Enter your current password"
                                        className="input input-bordered w-full pl-10 text-white bg-black/20 focus:bg-black/30"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                             <div className="form-control">
                                <label className="label">
                                    <span className="label-text text-white/70">New Username</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Leave blank to keep unchanged"
                                        className="input input-bordered w-full pl-10 text-white bg-black/20 focus:bg-black/30"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text text-white/70">New Password</span>
                                    </label>
                                     <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="password"
                                            placeholder="Leave blank to keep unchanged"
                                            className="input input-bordered w-full pl-10 text-white bg-black/20 focus:bg-black/30"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text text-white/70">Confirm New Password</span>
                                    </label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="password"
                                            placeholder="Confirm new password"
                                            className="input input-bordered w-full pl-10 text-white bg-black/20 focus:bg-black/30"
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            {credentialNotification && (
                                <div className={`text-sm ${credentialNotification.success ? 'text-green-400' : 'text-red-400'}`}>
                                    {credentialNotification.message}
                                </div>
                            )}
                            <div className="card-actions justify-end">
                                <button type="submit" className="btn btn-primary" disabled={isCredentialUpdateLoading}>
                                    {isCredentialUpdateLoading ? <LoaderCircle className="animate-spin" /> : <Check />}
                                    Update Credentials
                                </button>
                            </div>
                        </form>
                    </div>
                </div>


                <div className="card bg-white/10 border border-white/20">
                    <div className="card-body">
                        <h2 className="card-title text-white">Device & Account Actions</h2>
                        <p className="text-sm text-gray-400 mb-4">Perform actions on your account or device.</p>
                        <div className="card-actions justify-start flex-wrap gap-4">
                            <label htmlFor="report_modal_toggle" className="btn btn-outline text-white hover:bg-primary">
                                <MessageSquareWarning size={16} className="mr-2"/> Report an Issue
                            </label>
                            <button onClick={openRebootModal} className="btn btn-outline btn-warning text-white hover:bg-amber-600">
                                <Power size={16} className="mr-2"/> Reboot Router
                            </button>
                            <button onClick={handleLogout} className="btn btn-outline btn-error text-white hover:bg-red-600 ml-auto">
                                <LogOut size={16} className="mr-2"/> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
