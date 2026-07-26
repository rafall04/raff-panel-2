"use client";

import { useState } from "react";
import type { SSIDInfo } from "../actions";
import Form from "../client.form"; // Re-using the existing form component
import { Info, ShieldCheck, Wifi } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

export default function WifiView({
  ssidInfo: initialSsidInfo,
}: {
  ssidInfo: SSIDInfo;
}) {
  const [ssidInfo] = useState<SSIDInfo>(initialSsidInfo);

  // Initialize selectedSSID to "1" if available, otherwise to the first SSID.
  const [selectedSSID, setSelectedSSID] = useState<string>(() => {
    const availableSsids = ssidInfo.ssid;
    if (availableSsids.some((s) => s.id === "1")) {
      return "1";
    }
    const firstSsid = availableSsids.length > 0 ? availableSsids[0] : null;
    return firstSsid?.id || "";
  });

  // Initialize with no SSIDs synced, so the switch is off by default.
  const [syncedSsids, setSyncedSsids] = useState<string[]>([]);

  const refreshSsidInfo = () => {
    window.location.reload();
  };

  const handleSyncChange = (checked: boolean) => {
    // When toggling, use the list of all available SSIDs from props.
    setSyncedSsids(checked ? ssidInfo.ssid.map((s) => s.id) : []);
  };

  const isSynced = syncedSsids.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wifi}
        eyebrow="Jaringan"
        title="Kelola WiFi"
        description="Ubah nama dan kata sandi WiFi Anda. Perubahan langsung diterapkan ke router."
      />

      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle className="flex items-center gap-2.5">
              <span className="icon-chip h-9 w-9">
                <Wifi className="h-[18px] w-[18px]" />
              </span>
              Pengaturan SSID
            </CardTitle>
            <CardDescription className="mt-1.5">
              Pilih jaringan yang ingin diubah, atau samakan semuanya sekaligus.
            </CardDescription>
          </div>

          {/* Segmented SSID picker. A dropdown hid how many bands exist and cost
              an extra tap; with two or three SSIDs the choices fit inline and
              the selected one stays visible while the form is edited. */}
          <div className="space-y-3">
            <div
              role="radiogroup"
              aria-label="Pilih jaringan"
              className={cn(
                "no-scrollbar flex items-stretch gap-2 overflow-x-auto rounded-xl border bg-muted/40 p-1.5 transition-opacity",
                isSynced && "pointer-events-none opacity-50",
              )}
            >
              {ssidInfo.ssid.map((v) => {
                const isActive = !isSynced && selectedSSID === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    disabled={isSynced}
                    onClick={() => setSelectedSSID(v.id)}
                    className={cn(
                      "flex h-11 min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-card font-semibold text-brand shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Wifi className="h-4 w-4 shrink-0" />
                    <span className="truncate">{v.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3">
              <Label
                htmlFor="sync-ssid"
                className="flex-1 cursor-pointer text-sm font-medium"
              >
                Samakan semua jaringan
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  Terapkan nama &amp; kata sandi yang sama ke seluruh SSID.
                </span>
              </Label>
              <Switch
                id="sync-ssid"
                checked={isSynced}
                onCheckedChange={handleSyncChange}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Form
            ssid={ssidInfo.ssid}
            selectedSsid={selectedSSID}
            syncedSsids={syncedSsids}
            refreshSsidInfo={refreshSsidInfo}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="tile flex items-start gap-3">
          <span className="icon-chip h-9 w-9">
            <ShieldCheck className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Kata sandi yang kuat</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Gabungkan huruf besar, huruf kecil, dan angka. Hindari nomor
              telepon atau tanggal lahir.
            </p>
          </div>
        </div>
        <div className="tile flex items-start gap-3">
          <span className="icon-chip h-9 w-9">
            <Info className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Setelah menyimpan</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Semua perangkat akan terputus sesaat dan perlu disambungkan ulang
              dengan pengaturan baru.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
