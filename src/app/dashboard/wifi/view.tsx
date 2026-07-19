"use client";

import { useState } from "react";
import type { SSIDInfo } from "../actions";
import Form from "../client.form"; // Re-using the existing form component
import { Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";

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

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Wifi}
        title="Kelola WiFi"
        description="Ubah nama dan kata sandi WiFi Anda."
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="icon-chip">
                <Wifi className="h-5 w-5" />
              </span>
              Pengaturan SSID
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="sync-ssid"
                  checked={syncedSsids.length > 0}
                  onCheckedChange={handleSyncChange}
                />
                <Label htmlFor="sync-ssid" className="text-sm">
                  Samakan Semua
                </Label>
              </div>
              <Select
                value={selectedSSID}
                onValueChange={setSelectedSSID}
                disabled={syncedSsids.length > 0}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Pilih SSID" />
                </SelectTrigger>
                <SelectContent>
                  {ssidInfo.ssid.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
    </div>
  );
}
