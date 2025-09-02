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

type AssociatedDevicesTableProps = {
    devices: SSIDInfo['ssid'][0]['associatedDevices'];
};

export default function AssociatedDevicesTable({ devices }: AssociatedDevicesTableProps) {
    if (devices.length === 0) {
        return <p className="text-muted-foreground text-center py-8">No associated devices found.</p>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Device Name</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="text-right">Signal</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {devices.map((device, index) => (
                    <TableRow key={device.mac || index}>
                        <TableCell className="font-medium">{device.hostName || "Unknown Device"}</TableCell>
                        <TableCell>{device.ip || "N/A"}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                                <span>{device.signal || "N/A"}</span>
                                <SignalStrengthIcon signalDbm={device.signal ? parseInt(device.signal.replace(' dBm', '')) : null} />
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
