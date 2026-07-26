"use client";

import type { LucideIcon } from "lucide-react";
import { Signal, SignalHigh, SignalMedium, SignalLow } from "lucide-react";
import { cn } from "@/lib/utils";

// RSSI (Received Signal Strength Indicator) values are in dBm and are negative.
// A value closer to 0 is a stronger signal.
// Good: > -67 dBm
// Fair: -68 to -70 dBm
// Weak: -71 to -80 dBm
// Very Weak: < -80 dBm
interface SignalTier {
  label: string;
  icon: LucideIcon;
  tone: string;
}

function tierFor(signalDbm: number): SignalTier {
  if (signalDbm >= -67) {
    return { label: "Sangat Baik", icon: Signal, tone: "text-success" };
  }
  if (signalDbm >= -70) {
    return { label: "Baik", icon: SignalHigh, tone: "text-success" };
  }
  if (signalDbm >= -80) {
    return { label: "Cukup", icon: SignalMedium, tone: "text-warning" };
  }
  return { label: "Lemah", icon: SignalLow, tone: "text-destructive" };
}

/**
 * Signal strength as an icon plus a plain-language grade.
 *
 * The grade is the point: "-72 dBm" means nothing to a customer, and colour
 * alone can't carry the meaning for anyone who can't distinguish green from
 * amber. The raw reading stays available as a tooltip.
 */
export default function SignalStrengthIcon({
  signalDbm,
  showLabel = false,
}: {
  signalDbm: number | null;
  showLabel?: boolean;
}) {
  if (signalDbm === null || Number.isNaN(signalDbm)) {
    return <span className="text-xs text-muted-foreground">N/A</span>;
  }

  const tier = tierFor(signalDbm);
  const Icon = tier.icon;

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", tier.tone)}
      title={`${signalDbm} dBm`}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      {showLabel ? (
        <span className="text-xs font-semibold">{tier.label}</span>
      ) : (
        <span className="sr-only">{tier.label}</span>
      )}
    </span>
  );
}
