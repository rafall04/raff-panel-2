"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  rebootRouter,
  requestPackageChange,
  updateCredentials,
} from "../actions";
import type { CustomerInfo } from "../actions";
import type { LucideIcon } from "lucide-react";
import {
  Settings,
  LogOut,
  Power,
  MessageSquareWarning,
  Check,
  LoaderCircle,
  PackageCheck,
  ArrowRight,
  KeyRound,
  Wrench,
  User,
  AtSign,
  Phone,
  MapPin,
  Info,
  ChevronRight,
} from "lucide-react";
import PhoneNumbersManagement from "../phone-numbers";
import { PageHeader } from "@/components/ui/page-header";
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

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

interface MonthlyPackage {
  id: number | string;
  name: string;
  price: number;
  profile: string;
  description: string;
}

/** Reject the promise on a non-2xx backend status so toast.promise shows an error. */
function ensureOk(result: { status?: number; message?: string }) {
  if (result.status && (result.status < 200 || result.status >= 300)) {
    throw new Error(result.message || "Terjadi kesalahan.");
  }
  return result;
}

function ProfileRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="break-words text-sm font-medium">{value || "—"}</div>
      </div>
    </div>
  );
}

export default function SettingsView({
  allPackages,
  currentCustomerInfo,
}: {
  allPackages: MonthlyPackage[];
  currentCustomerInfo: CustomerInfo;
}) {
  const { openDialog: openReportDialog } = useReportDialog();
  const [isLoadingReboot, setIsLoadingReboot] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<MonthlyPackage | null>(
    null,
  );
  const [isChangeLoading, setIsChangeLoading] = useState(false);

  // Username change (separate from password — you never need to touch one to change the other)
  const [usernameCurrentPw, setUsernameCurrentPw] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);

  // Password change
  const [passwordCurrentPw, setPasswordCurrentPw] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [isRebootDialogOpen, setRebootDialogOpen] = useState(false);
  const [isPackageListOpen, setPackageListOpen] = useState(false);
  const [isPackageConfirmOpen, setPackageConfirmOpen] = useState(false);
  const [isUsernameDialogOpen, setUsernameDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setPasswordDialogOpen] = useState(false);

  const currentPackageName =
    currentCustomerInfo.package || currentCustomerInfo.packageName || "N/A";
  const monthlyBill =
    currentCustomerInfo.monthlyBillFormatted ||
    currencyFormatter.format(currentCustomerInfo.monthlyBill);

  const availablePackages = allPackages.filter(
    (p) =>
      p.name !==
      (currentCustomerInfo.package || currentCustomerInfo.packageName),
  );

  const handleUpdateUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameCurrentPw) {
      toast.error("Kata sandi saat ini diperlukan untuk verifikasi.");
      return;
    }
    if (!newUsername.trim()) {
      toast.error("Masukkan nama pengguna baru.");
      return;
    }
    setUsernameLoading(true);
    const promise = updateCredentials(
      usernameCurrentPw,
      newUsername.trim(),
      undefined,
    ).then(ensureOk);
    toast.promise(promise, {
      loading: "Memperbarui nama pengguna...",
      success: (result) => {
        setUsernameCurrentPw("");
        setNewUsername("");
        setUsernameDialogOpen(false);
        return result.message || "Nama pengguna berhasil diperbarui!";
      },
      error: (err) => err.message || "Gagal memperbarui nama pengguna.",
      finally: () => setUsernameLoading(false),
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordCurrentPw) {
      toast.error("Kata sandi saat ini diperlukan untuk verifikasi.");
      return;
    }
    if (!newPassword) {
      toast.error("Masukkan kata sandi baru.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("Konfirmasi kata sandi baru tidak cocok!");
      return;
    }
    setPasswordLoading(true);
    const promise = updateCredentials(
      passwordCurrentPw,
      undefined,
      newPassword,
    ).then(ensureOk);
    toast.promise(promise, {
      loading: "Memperbarui kata sandi...",
      success: (result) => {
        setPasswordCurrentPw("");
        setNewPassword("");
        setConfirmNewPassword("");
        setPasswordDialogOpen(false);
        return result.message || "Kata sandi berhasil diperbarui!";
      },
      error: (err) => err.message || "Gagal memperbarui kata sandi.",
      finally: () => setPasswordLoading(false),
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
      setPackageConfirmOpen(false);
      if (result.success) {
        toast.success(result.message || "Permintaan perubahan paket berhasil!");
        setPackageListOpen(false);
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
    <div className="space-y-5">
      <PageHeader
        icon={Settings}
        title="Pengaturan"
        description="Kelola profil, akun, langganan, dan perangkat Anda."
      />

      {/* Profile (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="icon-chip">
              <User className="h-5 w-5" />
            </span>
            Profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ProfileRow
            icon={User}
            label="Nama"
            value={currentCustomerInfo.name}
          />
          <ProfileRow
            icon={AtSign}
            label="Nama Pengguna"
            value={currentCustomerInfo.username}
          />
          <ProfileRow
            icon={Phone}
            label="Nomor HP Utama"
            value={currentCustomerInfo.phone_number}
          />
          <ProfileRow
            icon={MapPin}
            label="Alamat"
            value={currentCustomerInfo.address}
          />
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            Untuk mengubah nama atau alamat, hubungi admin lewat WhatsApp atau
            kirim laporan.
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="icon-chip">
              <PackageCheck className="h-5 w-5" />
            </span>
            Langganan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-brand/20 bg-brand/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">
              Paket Aktif
            </p>
            <p className="mt-1 text-lg font-bold">{currentPackageName}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {monthlyBill}
              </span>{" "}
              / bulan
            </p>
          </div>

          <Dialog open={isPackageListOpen} onOpenChange={setPackageListOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <PackageCheck size={16} className="mr-2" /> Ubah Paket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Ubah Paket Langganan</DialogTitle>
                <DialogDescription>
                  Pilih paket baru. Perubahan akan ditinjau oleh admin.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {availablePackages.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {availablePackages.map((pkg) => (
                      <Card key={pkg.id} className="flex flex-col">
                        <CardHeader>
                          <CardTitle className="text-base">
                            {pkg.name}
                          </CardTitle>
                          {pkg.profile && (
                            <CardDescription className="text-sm">
                              🚀 {pkg.profile}
                            </CardDescription>
                          )}
                          <CardDescription className="font-semibold text-brand">
                            {currencyFormatter.format(pkg.price)} / bulan
                          </CardDescription>
                          {pkg.description && (
                            <CardDescription className="mt-2 text-xs">
                              {pkg.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardFooter className="mt-auto">
                          <Button
                            onClick={() => handleSelectPackage(pkg)}
                            size="sm"
                            className="group w-full"
                          >
                            Ajukan Perubahan{" "}
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-center text-muted-foreground">
                    Tidak ada paket lain yang tersedia saat ini.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Account: username + password as SEPARATE forms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="icon-chip">
              <KeyRound className="h-5 w-5" />
            </span>
            Akun
          </CardTitle>
          <CardDescription>
            Ubah nama pengguna dan kata sandi secara terpisah. Setiap perubahan
            butuh kata sandi Anda saat ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="tile flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <AtSign className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Nama Pengguna
              </p>
              <p className="truncate font-semibold">
                {currentCustomerInfo.username || "—"}
              </p>
            </div>
          </div>

          {/* Change username (dialog) */}
          <Dialog
            open={isUsernameDialogOpen}
            onOpenChange={setUsernameDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <AtSign className="h-4 w-4" /> Ubah Nama Pengguna
                </span>
                <ChevronRight className="h-4 w-4 opacity-60" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ubah Nama Pengguna</DialogTitle>
                <DialogDescription>
                  Butuh kata sandi Anda saat ini untuk verifikasi.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateUsername} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username-current-pw">
                    Kata Sandi Saat Ini
                  </Label>
                  <Input
                    id="username-current-pw"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Masukkan kata sandi Anda saat ini"
                    value={usernameCurrentPw}
                    onChange={(e) => setUsernameCurrentPw(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-username">Nama Pengguna Baru</Label>
                  <Input
                    id="new-username"
                    type="text"
                    autoComplete="username"
                    placeholder="Nama pengguna baru"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={usernameLoading}>
                    {usernameLoading ? (
                      <LoaderCircle className="mr-2 animate-spin" />
                    ) : (
                      <Check className="mr-2" />
                    )}
                    Simpan
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Change password (dialog) */}
          <Dialog
            open={isPasswordDialogOpen}
            onOpenChange={setPasswordDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" /> Ubah Kata Sandi
                </span>
                <ChevronRight className="h-4 w-4 opacity-60" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ubah Kata Sandi</DialogTitle>
                <DialogDescription>
                  Butuh kata sandi Anda saat ini untuk verifikasi.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password-current-pw">
                    Kata Sandi Saat Ini
                  </Label>
                  <Input
                    id="password-current-pw"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Masukkan kata sandi Anda saat ini"
                    value={passwordCurrentPw}
                    onChange={(e) => setPasswordCurrentPw(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Kata Sandi Baru</Label>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Kata sandi baru"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">
                    Konfirmasi Kata Sandi
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Ulangi kata sandi baru"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={passwordLoading}>
                    {passwordLoading ? (
                      <LoaderCircle className="mr-2 animate-spin" />
                    ) : (
                      <Check className="mr-2" />
                    )}
                    Simpan
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Phone numbers */}
      <PhoneNumbersManagement />

      {/* Device & account actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="icon-chip">
              <Wrench className="h-5 w-5" />
            </span>
            Tindakan Perangkat &amp; Akun
          </CardTitle>
          <CardDescription>
            Lakukan tindakan pada akun atau perangkat Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Button
            variant="outline"
            onClick={openReportDialog}
            className="w-full justify-start"
          >
            <MessageSquareWarning size={16} className="mr-2" /> Laporkan Masalah
          </Button>
          <Dialog open={isRebootDialogOpen} onOpenChange={setRebootDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start border-amber-500/40 text-amber-500 hover:bg-amber-500/10 hover:text-amber-600"
              >
                <Power size={16} className="mr-2" /> Reboot Router
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apakah Anda yakin?</DialogTitle>
                <DialogDescription>
                  Router akan dimulai ulang. Ini mungkin memakan waktu beberapa
                  menit.
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
                    <LoaderCircle className="mr-2 animate-spin" />
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
            className="w-full justify-start border-red-500/40 text-red-500 hover:bg-red-500/10 hover:text-red-600 sm:col-span-2"
          >
            <LogOut size={16} className="mr-2" /> Keluar
          </Button>
        </CardContent>
      </Card>

      {/* Package change confirmation */}
      <Dialog open={isPackageConfirmOpen} onOpenChange={setPackageConfirmOpen}>
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
                  <span className="mt-1 block">
                    Kecepatan: <strong>{selectedPackage.profile}</strong>
                  </span>
                )}
                <span className="mt-1 block">
                  Harga baru:{" "}
                  <strong>
                    {currencyFormatter.format(selectedPackage.price)} / bulan
                  </strong>
                </span>
                <span className="mt-2 block text-xs">
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
                <LoaderCircle className="mr-2 animate-spin" />
              ) : (
                <Check className="mr-2" />
              )}
              Konfirmasi Permintaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
