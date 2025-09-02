"use client";

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { rebootRouter, requestPackageChange, updateCredentials } from '../actions';
import type { CustomerInfo, Package } from '../actions';
import { Settings, LogOut, Power, MessageSquareWarning, Check, LoaderCircle, PackageCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/language-switcher';

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
    const t = useTranslations('Settings');
    const [isLoadingReboot, setIsLoadingReboot] = useState(false);
    const [names, setNames] = useState<{id: number, name: string}[]>([]);

    useEffect(() => {
        const fetchNames = async () => {
            try {
                const response = await fetch('/api/names');
                const data = await response.json();
                setNames(data);
            } catch (error) {
                console.error("Failed to fetch names:", error);
            }
        };

        fetchNames();
    }, []);
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [isChangeLoading, setIsChangeLoading] = useState(false);

    // State for credentials update
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [isCredentialUpdateLoading, setIsCredentialUpdateLoading] = useState(false);

    const [isRebootDialogOpen, setRebootDialogOpen] = useState(false);
    const [isPackageListOpen, setPackageListOpen] = useState(false);
    const [isPackageConfirmOpen, setPackageConfirmOpen] = useState(false);
    const [isErrorDialogOpen, setErrorDialogOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const availablePackages = allPackages.filter(p => p.name !== currentCustomerInfo.packageName);

    const handleUpdateCredentials = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmNewPassword) {
            toast.error("New passwords do not match!");
            return;
        }
        if (!currentPassword) {
            toast.error("Current password is required to make changes.");
            return;
        }
        if (!newUsername && !newPassword) {
            toast.info("You must provide either a new username or a new password.");
            return;
        }

        setIsCredentialUpdateLoading(true);
        const promise = updateCredentials(currentPassword, newUsername || undefined, newPassword || undefined);

        toast.promise(promise, {
            loading: 'Updating credentials...',
            success: (result) => {
                setNewUsername('');
                setNewPassword('');
                setConfirmNewPassword('');
                setCurrentPassword('');
                return result.message || 'Credentials updated successfully!';
            },
            error: (err) => err.message || 'Failed to update credentials.',
            finally: () => setIsCredentialUpdateLoading(false)
        });
    };

    const handleLogout = () => {
        toast("Logging out...");
        signOut({ callbackUrl: '/login' });
    };

    const handleReboot = async () => {
        setIsLoadingReboot(true);
        try {
            await rebootRouter();
            toast.success("Reboot command sent successfully!");
        } catch (error) {
            toast.error("Failed to send reboot command.");
            console.error("Failed to reboot router:", error);
        } finally {
            setIsLoadingReboot(false);
            setRebootDialogOpen(false);
        }
    };

    const handleSelectPackage = (pkg: Package) => {
        setSelectedPackage(pkg);
        setPackageConfirmOpen(true);
    };

    const handleConfirmPackageChange = async () => {
        if (!selectedPackage) return;

        setIsChangeLoading(true);
        try {
            const result = await requestPackageChange(selectedPackage.name);
            setPackageConfirmOpen(false); // Close confirmation dialog regardless of outcome

            if (result.success) {
                toast.success(result.message || "Package change requested successfully!");
                setPackageListOpen(false); // Close package list only on success
            } else {
                setErrorMessage(result.message || "An unknown error occurred.");
                setErrorDialogOpen(true);
            }
        } catch (error) {
            setPackageConfirmOpen(false);
            setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred.");
            setErrorDialogOpen(true);
        } finally {
            setIsChangeLoading(false);
            setSelectedPackage(null);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 flex items-center">
                <Settings className="mr-3"/>
                {t('title')}
            </h1>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('subscriptionTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-primary">{currentCustomerInfo.packageName}</p>
                            <p className="text-muted-foreground">{currencyFormatter.format(currentCustomerInfo.monthlyBill)} / month</p>
                        </div>
                        <Dialog open={isPackageListOpen} onOpenChange={setPackageListOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline"><PackageCheck size={16} className="mr-2"/>{t('changePackage')}</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[625px]">
                                <DialogHeader>
                                    <DialogTitle>Change Subscription Package</DialogTitle>
                                    <DialogDescription>Select a new package. Changes will be reviewed by an admin.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    {availablePackages.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {availablePackages.map(pkg => (
                                                <Card key={pkg.name}>
                                                    <CardHeader>
                                                        <CardTitle>{pkg.profile}</CardTitle>
                                                        <CardDescription>{currencyFormatter.format(parseFloat(pkg.price))} / month</CardDescription>
                                                    </CardHeader>
                                                    <CardFooter>
                                                         <Button onClick={() => handleSelectPackage(pkg)} size="sm" className="w-full group">
                                                            Request Change <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform"/>
                                                        </Button>
                                                    </CardFooter>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted-foreground py-4">No other packages are available at the moment.</p>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('language')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <LanguageSwitcher />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('accountCredentialsTitle')}</CardTitle>
                        <CardDescription>{t('accountCredentialsDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateCredentials} className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="current-password">{t('currentPasswordLabel')}</Label>
                                <Input id="current-password" type="password" placeholder={t('currentPasswordPlaceholder')} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-username">{t('newUsernameLabel')}</Label>
                                <Input id="new-username" type="text" placeholder={t('newUsernamePlaceholder')} value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">{t('newPasswordLabel')}</Label>
                                    <Input id="new-password" type="password" placeholder={t('newPasswordPlaceholder')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">{t('confirmPasswordLabel')}</Label>
                                    <Input id="confirm-password" type="password" placeholder={t('confirmPasswordPlaceholder')} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isCredentialUpdateLoading}>
                                    {isCredentialUpdateLoading ? <LoaderCircle className="animate-spin mr-2" /> : <Check className="mr-2" />}
                                    {t('updateCredentialsButton')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('name')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul>
                            {names.map(name => (
                                <li key={name.id}>{name.name}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('deviceActionsTitle')}</CardTitle>
                        <CardDescription>{t('deviceActionsDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                        <DialogTrigger asChild>
                            <Button variant="outline"><MessageSquareWarning size={16} className="mr-2"/> {t('reportIssue')}</Button>
                        </DialogTrigger>
                        <Dialog open={isRebootDialogOpen} onOpenChange={setRebootDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="text-amber-500 border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-600">
                                    <Power size={16} className="mr-2"/> {t('rebootRouter')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Are you sure?</DialogTitle>
                                    <DialogDescription>The router will restart. This may take a few minutes.</DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setRebootDialogOpen(false)}>Cancel</Button>
                                    <Button variant="destructive" onClick={handleReboot} disabled={isLoadingReboot}>
                                        {isLoadingReboot ? <LoaderCircle className="animate-spin mr-2"/> : <Check className="mr-2"/>}
                                        Confirm Reboot
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <Button onClick={handleLogout} variant="outline" className="text-red-500 border-red-500/50 hover:bg-red-500/10 hover:text-red-600 ml-auto">
                            <LogOut size={16} className="mr-2"/> {t('logout')}
                        </Button>
                    </CardContent>
                </Card>

                 <Dialog open={isPackageConfirmOpen} onOpenChange={setPackageConfirmOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Package Change</DialogTitle>
                            {selectedPackage && (
                                <DialogDescription>
                                    You are requesting to change your package to: <b>{selectedPackage.name} ({selectedPackage.profile})</b> for <b>{currencyFormatter.format(parseFloat(selectedPackage.price))}</b>. This request will be sent for admin approval.
                                </DialogDescription>
                            )}
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setPackageConfirmOpen(false)}>Cancel</Button>
                            <Button onClick={handleConfirmPackageChange} disabled={isChangeLoading}>
                                {isChangeLoading ? <LoaderCircle className="animate-spin mr-2"/> : <Check className="mr-2"/>}
                                Confirm Request
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isErrorDialogOpen} onOpenChange={setErrorDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-red-500 flex items-center">
                                <MessageSquareWarning className="mr-2" />
                                Request Failed
                            </DialogTitle>
                            <DialogDescription>
                                {errorMessage}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setErrorDialogOpen(false)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
