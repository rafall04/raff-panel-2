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

const allowSsid = ["1", "5"];

export default function WifiView({ ssidInfo: initialSsidInfo }: { ssidInfo: SSIDInfo }) {
    const [ssidInfo] = useState<SSIDInfo>(initialSsidInfo);
    const [selectedSSID, setSelectedSSID] = useState<string>(ssidInfo.ssid[0].id);
    const [syncedSsids, setSyncedSsids] = useState<string[]>(allowSsid);

    const refreshSsidInfo = () => {
        window.location.reload();
    };

    const handleSyncChange = (checked: boolean) => {
        setSyncedSsids(checked ? allowSsid : []);
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
