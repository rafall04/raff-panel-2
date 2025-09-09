"use client";

import { useState } from "react";
import type { SSIDInfo } from "../actions";
import Form from "../client.form"; // Re-using the existing form component
import { Wifi } from 'lucide-react';
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

export default function WifiView({ ssidInfo: initialSsidInfo }: { ssidInfo: SSIDInfo }) {
    const [ssidInfo] = useState<SSIDInfo>(initialSsidInfo);

    // Initialize selectedSSID to "1" if available, otherwise to the first SSID.
    const [selectedSSID, setSelectedSSID] = useState<string>(() => {
        const availableSsids = ssidInfo.ssid;
        if (availableSsids.some(s => s.id === "1")) {
            return "1";
        }
        return availableSsids.length > 0 ? availableSsids[0].id : "";
    });

    // Initialize with no SSIDs synced, so the switch is off by default.
    const [syncedSsids, setSyncedSsids] = useState<string[]>([]);

    const refreshSsidInfo = () => {
        window.location.reload();
    };

    const handleSyncChange = (checked: boolean) => {
        // When toggling, use the list of all available SSIDs from props.
        setSyncedSsids(checked ? ssidInfo.ssid.map(s => s.id) : []);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                    <CardTitle className="mb-4 sm:mb-0 flex items-center"><Wifi className="mr-2"/>SSID Management</CardTitle>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="sync-ssid"
                                checked={syncedSsids.length > 0}
                                onCheckedChange={handleSyncChange}
                            />
                            <Label htmlFor="sync-ssid">Sync SSIDs</Label>
                        </div>
                        <Select
                            value={selectedSSID}
                            onValueChange={setSelectedSSID}
                            disabled={syncedSsids.length > 0}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select SSID" />
                            </SelectTrigger>
                            <SelectContent>
                                {ssidInfo.ssid.map((v) => (
                                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Form ssid={ssidInfo!.ssid} selectedSsid={selectedSSID} syncedSsids={syncedSsids} refreshSsidInfo={refreshSsidInfo}/>
            </CardContent>
        </Card>
    );
}
