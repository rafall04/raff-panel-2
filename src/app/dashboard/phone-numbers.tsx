"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import type { PhoneNumbersResponse } from "@/services/phone.service";
import { Loader2, Phone, Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PhoneNumbersRouteResponse {
  success: boolean;
  data?: PhoneNumbersResponse;
  message?: string;
}

// Helper function untuk format phone number untuk display
const formatPhoneDisplay = (phone: string): string => {
  // Convert 6281234567890 to 081234567890
  if (phone.startsWith("62")) {
    return "0" + phone.substring(2);
  }
  return phone;
};

export default function PhoneNumbersManagement() {
  const [data, setData] = useState<PhoneNumbersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingPhone, setDeletingPhone] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [phoneToDelete, setPhoneToDelete] = useState<string | null>(null);

  const fetchPhoneNumbers = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/phone-numbers");

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || "Gagal mengambil daftar nomor HP");
        setData(null);
        return;
      }

      const response = (await res.json()) as PhoneNumbersRouteResponse;

      if (!response.success || !response.data) {
        setError(response.message || "Gagal mengambil daftar nomor HP");
        setData(null);
        return;
      }

      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPhoneNumbers();
  }, []);

  const handleAddPhoneNumber = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPhoneNumber.trim()) {
      toast.error("Nomor HP tidak boleh kosong");
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch("/api/phone-numbers/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: newPhoneNumber.trim() }),
      });

      const response = (await res.json()) as {
        success: boolean;
        message?: string;
      };

      if (!res.ok) {
        toast.error(response.message || "Gagal menambahkan nomor HP");
        return;
      }

      toast.success("Nomor HP berhasil ditambahkan");
      setNewPhoneNumber("");
      setIsAddDialogOpen(false);
      await fetchPhoneNumbers(); // Refresh list
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeletePhoneNumber = async (phoneNumber: string) => {
    setPhoneToDelete(phoneNumber);
    setDeleteConfirmOpen(true);
  };

  const confirmDeletePhoneNumber = async () => {
    if (!phoneToDelete) {
      return;
    }

    setDeletingPhone(phoneToDelete);
    try {
      const encodedPhone = encodeURIComponent(phoneToDelete);
      const res = await fetch(`/api/phone-numbers/${encodedPhone}`, {
        method: "DELETE",
      });

      const response = (await res.json()) as {
        success: boolean;
        message?: string;
      };

      if (!res.ok) {
        toast.error(response.message || "Gagal menghapus nomor HP");
        return;
      }

      toast.success("Nomor HP berhasil dihapus");
      await fetchPhoneNumbers(); // Refresh list
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setDeletingPhone(null);
      setPhoneToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="icon-chip">
              <Phone className="h-5 w-5" />
            </span>
            Nomor HP Terdaftar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ListSkeleton rows={2} trailing={false} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="icon-chip">
              <Phone className="h-5 w-5" />
            </span>
            Nomor HP Terdaftar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <p className="text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="icon-chip">
              <Phone className="h-5 w-5" />
            </span>
            Nomor HP Terdaftar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Tidak dapat memuat data nomor HP.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="icon-chip">
            <Phone className="h-5 w-5" />
          </span>
          Nomor HP Terdaftar
        </CardTitle>
        <CardDescription>
          Anda memiliki {data.current_count} dari {data.max_allowed} nomor HP
          yang diizinkan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {data.phone_numbers.length > 0 ? (
            <ul className="space-y-2">
              {data.phone_numbers.map((phone, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono">
                      {formatPhoneDisplay(phone)}
                    </span>
                  </div>
                  {data.current_count > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        void handleDeletePhoneNumber(phone);
                      }}
                      disabled={deletingPhone === phone}
                      className="text-destructive hover:text-destructive"
                    >
                      {deletingPhone === phone ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Phone}
              title="Belum ada nomor HP"
              description="Tambahkan nomor HP untuk menerima notifikasi & OTP."
            />
          )}
        </div>

        {data.current_count < data.max_allowed && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Nomor HP
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form
                onSubmit={(e) => {
                  void handleAddPhoneNumber(e);
                }}
              >
                <DialogHeader>
                  <DialogTitle>Tambah Nomor HP</DialogTitle>
                  <DialogDescription>
                    Masukkan nomor HP baru. Format: 08xxxxxxxxx, 628xxxxxxxxx,
                    atau +628xxxxxxxxx
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone-number">Nomor HP</Label>
                    <Input
                      id="phone-number"
                      type="tel"
                      placeholder="081234567890"
                      value={newPhoneNumber}
                      onChange={(e) => setNewPhoneNumber(e.target.value)}
                      required
                      disabled={isAdding}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={isAdding}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isAdding}>
                    {isAdding ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menambahkan...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {data.current_count >= data.max_allowed && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Anda sudah mencapai batas maksimal {data.max_allowed} nomor HP.
            </p>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Hapus Nomor HP</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus nomor{" "}
                {phoneToDelete ? (
                  <span className="font-mono font-semibold">
                    {formatPhoneDisplay(phoneToDelete)}
                  </span>
                ) : (
                  "ini"
                )}
                ? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setPhoneToDelete(null);
                  setDeleteConfirmOpen(false);
                }}
                disabled={deletingPhone !== null}
              >
                Batal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  void confirmDeletePhoneNumber();
                }}
                disabled={deletingPhone !== null}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingPhone ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  "Hapus"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
