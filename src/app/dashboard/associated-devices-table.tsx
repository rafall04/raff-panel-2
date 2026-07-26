"use client";

import type { SSIDInfo } from "./actions";
import SignalStrengthIcon from "./SignalStrengthIcon";
import { EmptyState } from "@/components/ui/empty-state";
import { Laptop, MonitorSmartphone } from "lucide-react";

type AssociatedDevicesTableProps = {
  devices: SSIDInfo["ssid"][0]["associatedDevices"];
};

/** "-72 dBm" → -72. Returns null for missing or unparseable readings. */
function parseSignal(signal: string | null | undefined): number | null {
  if (!signal) {
    return null;
  }
  const parsed = Number.parseInt(signal.replace(" dBm", ""), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Connected-device list.
 *
 * A three-column table is unreadable at 375px — the IP column alone eats half
 * the width — so each device is a row that stacks its own fields: identity on
 * the left, signal on the right, IP underneath on phones and inline from sm up.
 */
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
    <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border">
      {devices.map((device, index) => (
        <li
          key={device.mac || index}
          className="flex items-center gap-3 bg-card p-3 transition-colors hover:bg-muted/40 sm:p-3.5"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground">
            <Laptop className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {device.hostName || "Perangkat Tidak Dikenal"}
            </p>
            <p className="tabular truncate text-xs text-muted-foreground">
              {device.ip || "IP tidak tersedia"}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <SignalStrengthIcon
              signalDbm={parseSignal(device.signal)}
              showLabel
            />
            {device.signal ? (
              <span className="tabular text-[11px] text-muted-foreground">
                {device.signal}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
