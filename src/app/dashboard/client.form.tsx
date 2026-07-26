"use client";

import { FormEvent, useEffect, useState } from "react";
import { updateWifiSettings } from "./actions";
import { Lock, Type, Save, Eye, EyeOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Form({
  ssid,
  selectedSsid,
  syncedSsids,
  refreshSsidInfo,
}: {
  ssid: { id: string; name: string }[];
  selectedSsid: string;
  syncedSsids: string[];
  refreshSsidInfo: () => void;
}) {
  // Get selected SSID name or fallback to first SSID
  const getSsidName = (): string => {
    const selected = ssid.find((v) => v.id === selectedSsid);
    if (selected) {
      return selected.name;
    }
    const firstSsid = ssid.length > 0 ? ssid[0] : null;
    return firstSsid?.name || "";
  };

  const [form, setForm] = useState({
    ssid: getSsidName(),
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const selectedIds = syncedSsids.length > 0 ? syncedSsids : [selectedSsid];
    const selectedName = ssid.find((v) => v.id === selectedSsid)?.name || "";
    const newName = form.ssid !== selectedName ? form.ssid : undefined;
    const newPassword = form.password.length > 0 ? form.password : undefined;

    if (!newName && !newPassword) {
      toast.info("No changes to save.");
      setLoading(false);
      return;
    }

    try {
      const result = await updateWifiSettings({
        ssidIds: selectedIds,
        newName,
        newPassword,
      });

      if (result.success) {
        toast.success(result.message);
      } else if (result.successCount > 0) {
        toast.warning(result.message);
      } else {
        toast.error(result.message);
      }

      void refreshSsidInfo();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update settings.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setForm({
      ssid: getSsidName(),
      password: "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSsid, ssid]);

  const targetCount = syncedSsids.length > 0 ? syncedSsids.length : 1;

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ssid">Nama WiFi (SSID)</Label>
          <div className="relative">
            <Type className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
            <Input
              id="ssid"
              type="text"
              value={form.ssid}
              onChange={(e) => setForm({ ...form, ssid: e.target.value })}
              className="pl-11"
              required
              maxLength={32}
              autoComplete="off"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Nama yang muncul saat perangkat mencari jaringan. Maksimal 32
            karakter.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Kata Sandi Baru (opsional)</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Kosongkan jika tidak diubah"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="pl-11 pr-12"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={
                showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
              }
              className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Minimal 8 karakter. Semua perangkat harus tersambung ulang setelah
            kata sandi diubah.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Says out loud how many networks the Save button is about to touch —
            the "Samakan Semua" switch above is easy to flip and forget. */}
        <p className="text-xs text-muted-foreground">
          Perubahan diterapkan ke{" "}
          <span className="font-semibold text-foreground">
            {targetCount} jaringan
          </span>{" "}
          dan langsung dikirim ke router Anda.
        </p>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? <Loader2 className="animate-spin" /> : <Save />}
          Simpan Perubahan
        </Button>
      </div>
    </form>
  );
}
