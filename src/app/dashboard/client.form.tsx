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

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
    >
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="ssid">Nama WiFi (SSID)</Label>
          <div className="relative">
            <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="ssid"
              type="text"
              value={form.ssid}
              onChange={(e) => setForm({ ...form, ssid: e.target.value })}
              className="pl-10"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Kata Sandi Baru (opsional)</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Kosongkan jika tidak diubah"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
      </div>
      <div className="flex w-full justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <Loader2 size={16} className="mr-2 animate-spin" />
          ) : (
            <Save size={16} className="mr-2" />
          )}
          Simpan
        </Button>
      </div>
    </form>
  );
}
