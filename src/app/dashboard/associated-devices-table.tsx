"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SSIDInfo } from "./actions";
import SignalStrengthIcon from "./SignalStrengthIcon";
import { EmptyState } from "@/components/ui/empty-state";
import { MonitorSmartphone } from "lucide-react";

type AssociatedDevicesTableProps = {
  devices: SSIDInfo["ssid"][0]["associatedDevices"];
};

export default function AssociatedDevicesTable({
  devices,
}: AssociatedDevicesTableProps) {
  if (devices.length === 0) {
    return (
      <EmptyState
        icon={MonitorSmartphone}
        title="Belum ada perangkat terhubung"
        description="Perangkat yang terhubung ke WiFi Anda akan muncul di sini."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Perangkat</TableHead>
          <TableHead>Alamat IP</TableHead>
          <TableHead className="text-right">Sinyal</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {devices.map((device, index) => (
          <TableRow key={device.mac || index}>
            <TableCell className="font-medium">
              {device.hostName || "Perangkat Tidak Dikenal"}
            </TableCell>
            <TableCell>{device.ip || "N/A"}</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <span>{device.signal || "N/A"}</span>
                <SignalStrengthIcon
                  signalDbm={
                    device.signal
                      ? parseInt(device.signal.replace(" dBm", ""), 10)
                      : null
                  }
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
