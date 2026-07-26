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
import { PageHeader, SectionHeading } from "@/components/ui/page-header";
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
import { InfoRow } from "@/components/ui/info-row";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { currencyFormatter } from "@/lib/format";
import { useReportDialog } from "../report-dialog-context";
import { toast } from "sonner";

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
    <div className="space-y-8">
      <PageHeader
        icon={Settings}
        eyebrow="Akun"
        title="Pengaturan"
        description="Kelola profil, akun, langganan, dan perangkat Anda."
      />

      {/* ── Profil & langganan ─────────────────────────────────────────────
          Titles here pass a plain "&", not "&amp;": JSX decodes entities in
          element children but never inside a string-literal attribute, so the
          escaped form would render verbatim. */}
      <section className="space-y-3">
        <SectionHeading
          title="Profil & Langganan"
          description="Data akun Anda seperti yang tercatat di sistem kami."
        />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5">
                <span className="icon-chip h-9 w-9">
                  <User className="h-[18px] w-[18px]" />
                </span>
                Profil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <InfoRow
                icon={User}
                label="Nama"
                value={currentCustomerInfo.name}
              />
              <InfoRow
                icon={AtSign}
                label="Nama Pengguna"
                value={currentCustomerInfo.username}
              />
              <InfoRow
                icon={Phone}
                label="Nomor HP Utama"
                value={currentCustomerInfo.phone_number}
              />
              <InfoRow
                icon={MapPin}
                label="Alamat"
                value={currentCustomerInfo.address}
              />
              <div className="flex items-start gap-2.5 rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                Untuk mengubah nama atau alamat, hubungi admin lewat WhatsApp
                atau kirim laporan.
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5">
                <span className="icon-chip h-9 w-9">
                  <PackageCheck className="h-[18px] w-[18px]" />
                </span>
                Langganan
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              <div className="brand-panel">
                <p className="eyebrow text-brand">Paket Aktif</p>
                <p className="mt-1 text-lg font-bold leading-tight">
                  {currentPackageName}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  <span className="tabular font-semibold text-foreground">
                    {monthlyBill}
                  </span>{" "}
                  / bulan
                </p>
              </div>

              <Dialog
                open={isPackageListOpen}
                onOpenChange={setPackageListOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="mt-auto w-full">
                    <PackageCheck />
                    Ubah Paket
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Ubah Paket Langganan</DialogTitle>
                    <DialogDescription>
                      Pilih paket baru. Perubahan akan ditinjau oleh admin.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-1">
                    {availablePackages.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {availablePackages.map((pkg) => (
                          <Card key={pkg.id} className="flex flex-col">
                            <CardHeader className="gap-1.5 pb-3">
                              <CardTitle className="text-base">
                                {pkg.name}
                              </CardTitle>
                              {pkg.profile && (
                                <CardDescription className="flex items-center gap-1.5 text-xs">
                                  <ArrowRight className="h-3.5 w-3.5 text-brand" />
                                  {pkg.profile}
                                </CardDescription>
                              )}
                              <p className="tabular text-sm font-bold text-brand">
                                {currencyFormatter.format(pkg.price)}
                                <span className="font-normal text-muted-foreground">
                                  {" "}
                                  / bulan
                                </span>
                              </p>
                              {pkg.description && (
                                <CardDescription className="text-xs">
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
                                Ajukan Perubahan
                                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={PackageCheck}
                        title="Tidak ada paket lain"
                        description="Saat ini belum ada paket alternatif yang bisa diajukan."
                      />
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Keamanan ──────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeading
          title="Keamanan Akun"
          description="Setiap perubahan memerlukan kata sandi Anda saat ini."
        />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5">
                <span className="icon-chip h-9 w-9">
                  <KeyRound className="h-[18px] w-[18px]" />
                </span>
                Kredensial
              </CardTitle>
              <CardDescription>
                Ubah nama pengguna dan kata sandi secara terpisah.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="tile flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-muted-foreground">
                  <AtSign className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="eyebrow">Nama Pengguna</p>
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
                      <AtSign />
                      Ubah Nama Pengguna
                    </span>
                    <ChevronRight className="opacity-60" />
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
                          <LoaderCircle className="animate-spin" />
                        ) : (
                          <Check />
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
                      <KeyRound />
                      Ubah Kata Sandi
                    </span>
                    <ChevronRight className="opacity-60" />
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
                          <LoaderCircle className="animate-spin" />
                        ) : (
                          <Check />
                        )}
                        Simpan
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <PhoneNumbersManagement />
        </div>
      </section>

      {/* ── Device & account actions ──────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeading
          title="Perangkat & Sesi"
          description="Tindakan pada router Anda dan sesi login di perangkat ini."
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <span className="icon-chip h-9 w-9">
                <Wrench className="h-[18px] w-[18px]" />
              </span>
              Tindakan
            </CardTitle>
            <CardDescription>
              Reboot memutus koneksi sementara untuk semua perangkat di rumah
              Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Button
                variant="outline"
                onClick={openReportDialog}
                className="w-full justify-start"
              >
                <MessageSquareWarning />
                Laporkan Masalah
              </Button>
              <Dialog
                open={isRebootDialogOpen}
                onOpenChange={setRebootDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-warning/40 text-warning hover:border-warning/60 hover:bg-warning/10 hover:text-warning"
                  >
                    <Power />
                    Reboot Router
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reboot router sekarang?</DialogTitle>
                    <DialogDescription>
                      Router akan dimulai ulang dan koneksi terputus selama
                      beberapa menit. Semua perangkat akan tersambung kembali
                      secara otomatis.
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
                        <LoaderCircle className="animate-spin" />
                      ) : (
                        <Check />
                      )}
                      Konfirmasi Reboot
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Sign-out sits below a rule, apart from the routine actions —
                separating it is what stops a mis-tap from ending the session. */}
            <div className="border-t pt-3">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full justify-start border-destructive/40 text-destructive hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut />
                Keluar dari Akun
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

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
                  <strong className="tabular">
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
                <LoaderCircle className="animate-spin" />
              ) : (
                <Check />
              )}
              Konfirmasi Permintaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
