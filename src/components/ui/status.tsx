import * as React from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "online" | "offline" | "pending" | "neutral";

const toneDot: Record<StatusTone, string> = {
  online: "bg-success",
  offline: "bg-destructive",
  pending: "bg-warning",
  neutral: "bg-muted-foreground",
};

const tonePill: Record<StatusTone, string> = {
  online: "bg-success/12 text-success ring-1 ring-inset ring-success/25",
  offline:
    "bg-destructive/12 text-destructive ring-1 ring-inset ring-destructive/25",
  pending: "bg-warning/12 text-warning ring-1 ring-inset ring-warning/25",
  neutral: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
};

/**
 * Status dot with an optional expanding ring for live states.
 *
 * The ring animates transform/opacity only, so it never triggers layout, and it
 * is absolutely positioned inside a fixed-size box — a scaling element in flow
 * would nudge the label beside it.
 */
export function StatusDot({
  tone,
  pulse = false,
  className,
}: {
  tone: StatusTone;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("relative flex h-2 w-2 shrink-0", className)}
      aria-hidden="true"
    >
      {pulse ? (
        <span
          className={cn(
            "absolute inset-0 rounded-full animate-ping-ring",
            toneDot[tone],
          )}
        />
      ) : null}
      <span className={cn("relative h-2 w-2 rounded-full", toneDot[tone])} />
    </span>
  );
}

/**
 * Dot + text status chip. The text carries the meaning, so the state is still
 * readable without colour vision.
 */
export function StatusPill({
  tone,
  children,
  pulse = false,
  className,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("status-pill", tonePill[tone], className)}>
      <StatusDot tone={tone} pulse={pulse} />
      {children}
    </span>
  );
}
