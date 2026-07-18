"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  rebootRouter,
  requestPackageChange,
  updateCredentials,
} from "../actions";
import type { CustomerInfo } from "../actions";
import {
  Settings,
  LogOut,
  Power,
  MessageSquareWarning,
  Check,
  LoaderCircle,
  PackageCheck,
  ArrowRight,
} from "lucide-react";
import PackageChangeHistory from "../package-change-history";
import PhoneNumbersManagement from "../phone-numbers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useReportDialog } from "../report-dialog-context";
import { toast } from "sonner";

// Helper to format currency
const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

interface MonthlyPackage {
  id: number | string;
  name: string;
  price: number; // Number format, perlu diformat untuk display
  profile: string; // Kecepatan internet (displayProfile atau profile)
  description: string; // Optional, bisa empty string
}

export default function SettingsView({
  allPackages,
  currentCustomerInfo,
}: {
  allPackages: MonthlyPackage[]; // Changed from Package[] to MonthlyPackage[]
  currentCustomerInfo: CustomerInfo;
}) {
  const { openDialog: openReportDialog } = useReportDialog();
  const [isLoadingReboot, setIsLoadingReboot] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<MonthlyPackage | null>(
    null,
  );
  const [isChangeLoading, setIsChangeLoading] = useState(false);

  // State for credentials update
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isCredentialUpdateLoading, setIsCredentialUpdateLoading] =
    useState(false);

  const [isRebootDialogOpen, setRebootDialogOpen] = useState(false);
  const [isPackageListOpen, setPackageListOpen] = useState(false);
  const [isPackageConfirmOpen, setPackageConfirmOpen] = useState(false);

  // Filter out current package and format packages
  const availablePackages = allPackages.filter((p) => {
    const currentPackageName =
      currentCustomerInfo.package || currentCustomerInfo.packageName;
    return p.name !== currentPackageName;
  });

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      toast.error("Kata sandi baru tidak cocok!");
      return;
    }
    if (!currentPassword) {
      toast.error("Kata sandi saat ini diperlukan untuk membuat perubahan.");
      return;
    }
    if (!newUsername && !newPassword) {
      toast.info(
        "Anda harus menyediakan nama pengguna baru atau kata sandi baru.",
      );
      return;
    }

    setIsCredentialUpdateLoading(true);
    const promise = updateCredentials(
      currentPassword,
      newUsername || undefined,
      newPassword || undefined,
    );

    toast.promise(promise, {
      loading: "Memperbarui kredensial...",
      success: (result) => {
        setNewUsername("");
        setNewPassword("");
        setConfirmNewPassword("");
        setCurrentPassword("");
        return result.message || "Kredensial berhasil diperbarui!";
      },
      error: (err) => err.message || "Gagal memperbarui kredensial.",
      finally: () => setIsCredentialUpdateLoading(false),
    });
  };

  const handleLogout = () => {
    toast("Keluar...");
    void signOut({ callbackUrl: "/login" });
  };

  const handleReboot = async () => {
    setIsLoadingReboot(true);
    try {
      await rebootRouter();
      toast.success("Perintah reboot berhasil dikirim!");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal mengirim perintah reboot.",
      );
    } finally {
      setIsLoadingReboot(false);
      setRebootDialogOpen(false);
    }
  };

  const handleSelectPackage = (pkg: MonthlyPackage) => {
    setSelectedPackage(pkg);
    setPackageConfirmOpen(true);
  };

  const handleConfirmPackageChange = async () => {
    if (!selectedPackage) {
      return;
    }

    setIsChangeLoading(true);
    try {
      const result = await requestPackageChange(selectedPackage.name);
      setPackageConfirmOpen(false); // Close confirmation dialog regardless of outcome

      if (result.success) {
        toast.success(result.message || "Permintaan perubahan paket berhasil!");
        setPackageListOpen(false); // Close package list only on success
      } else {
        toast.error(
          result.message || "Terjadi kesalahan yang tidak diketahui.",
        );
      }
    } catch (error) {
      setPackageConfirmOpen(false);
      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan tak terduga.",
      );
    } finally {
      setIsChangeLoading(false);
      setSelectedPackage(null);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Settings className="mr-3" />
        Pengaturan & Tindakan
      </h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Langganan Anda</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-primary">
                {currentCustomerInfo.package ||
                  currentCustomerInfo.packageName ||
                  "N/A"}
              </p>
              <p className="text-muted-foreground">
                {currentCustomerInfo.monthlyBillFormatted ||
                  currencyFormatter.format(
                    currentCustomerInfo.monthlyBill,
                  )}{" "}
                / bulan
              </p>
            </div>
            <Dialog open={isPackageListOpen} onOpenChange={setPackageListOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <PackageCheck size={16} className="mr-2" /> Ubah Paket
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>Ubah Paket Langganan</DialogTitle>
                  <DialogDescription>
                    Pilih paket baru. Perubahan akan ditinjau oleh admin.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {availablePackages.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availablePackages.map((pkg) => (
                        <Card key={pkg.id}>
                          <CardHeader>
                            <CardTitle>{pkg.name}</CardTitle>
                            {pkg.profile && (
                              <CardDescription className="text-sm">
                                🚀 {pkg.profile}
                              </CardDescription>
                            )}
                            <CardDescription className="font-semibold">
                              {currencyFormatter.format(pkg.price)} / bulan
                            </CardDescription>
                            {pkg.description && (
                              <CardDescription className="text-xs mt-2">
                                {pkg.description}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardFooter>
                            <Button
                              onClick={() => handleSelectPackage(pkg)}
                              size="sm"
                              className="w-full group"
                            >
                              Ajukan Perubahan{" "}
                              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      Tidak ada paket lain yang tersedia saat ini.
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kredensial Akun</CardTitle>
            <CardDescription>
              Perbarui nama pengguna atau kata sandi Anda. Memerlukan kata sandi
              saat ini untuk verifikasi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                void handleUpdateCredentials(e);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="current-password">
                  Kata Sandi Saat Ini (Wajib)
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Masukkan kata sandi Anda saat ini"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-username">Nama Pengguna Baru</Label>
                <Input
                  id="new-username"
                  type="text"
                  placeholder="Biarkan kosong untuk tidak mengubah"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Kata Sandi Baru</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Biarkan kosong untuk tidak mengubah"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">
                    Konfirmasi Kata Sandi Baru
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Konfirmasi kata sandi baru"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isCredentialUpdateLoading}>
                  {isCredentialUpdateLoading ? (
                    <LoaderCircle className="animate-spin mr-2" />
                  ) : (
                    <Check className="mr-2" />
                  )}
                  Perbarui Kredensial
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tindakan Perangkat & Akun</CardTitle>
            <CardDescription>
              Lakukan tindakan pada akun atau perangkat Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {/* The report dialog lives in dashboard/layout.tsx as a SIBLING of
                {children}, so this page has no Dialog ancestor — a DialogTrigger
                here threw "must be used within Dialog" and killed the whole
                Settings page. Open it through the context instead, the same way
                status.view.tsx does. */}
            <Button variant="outline" onClick={openReportDialog}>
              <MessageSquareWarning size={16} className="mr-2" /> Laporkan
              Masalah
            </Button>
            <Dialog
              open={isRebootDialogOpen}
              onOpenChange={setRebootDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-amber-500 border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-600"
                >
                  <Power size={16} className="mr-2" /> Reboot Router
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Apakah Anda yakin?</DialogTitle>
                  <DialogDescription>
                    Router akan dimulai ulang. Ini mungkin memakan waktu
                    beberapa menit.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setRebootDialogOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      void handleReboot();
                    }}
                    disabled={isLoadingReboot}
                  >
                    {isLoadingReboot ? (
                      <LoaderCircle className="animate-spin mr-2" />
                    ) : (
                      <Check className="mr-2" />
                    )}
                    Konfirmasi Reboot
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-red-500 border-red-500/50 hover:bg-red-500/10 hover:text-red-600 ml-auto"
            >
              <LogOut size={16} className="mr-2" /> Keluar
            </Button>
          </CardContent>
        </Card>

        <Dialog
          open={isPackageConfirmOpen}
          onOpenChange={setPackageConfirmOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Perubahan Paket</DialogTitle>
              {selectedPackage && (
                <DialogDescription>
                  Anda akan mengajukan perubahan paket dari{" "}
                  <strong>
                    {currentCustomerInfo.package ||
                      currentCustomerInfo.packageName}
                  </strong>{" "}
                  ke <strong>{selectedPackage.name}</strong>.
                  {selectedPackage.profile && (
                    <span className="block mt-1">
                      Kecepatan: <strong>{selectedPackage.profile}</strong>
                    </span>
                  )}
                  <span className="block mt-1">
                    Harga baru:{" "}
                    <strong>
                      {currencyFormatter.format(selectedPackage.price)} / bulan
                    </strong>
                  </span>
                  <span className="block mt-2 text-xs">
                    Permintaan ini akan dikirim untuk persetujuan admin.
                  </span>
                </DialogDescription>
              )}
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setPackageConfirmOpen(false)}
              >
                Batal
              </Button>
              <Button
                onClick={() => {
                  void handleConfirmPackageChange();
                }}
                disabled={isChangeLoading}
              >
                {isChangeLoading ? (
                  <LoaderCircle className="animate-spin mr-2" />
                ) : (
                  <Check className="mr-2" />
                )}
                Konfirmasi Permintaan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Package Change Request History */}
      <PackageChangeHistory />

      {/* Phone Numbers Management */}
      <PhoneNumbersManagement />
    </div>
  );
}
