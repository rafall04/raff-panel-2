import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Accent = "default" | "brand" | "success" | "warning" | "destructive";

const accentText: Record<Accent, string> = {
  default: "text-foreground",
  brand: "text-brand",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

const accentChip: Record<Accent, string> = {
  default: "bg-muted text-muted-foreground",
  brand: "bg-brand/12 text-brand",
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  destructive: "bg-destructive/12 text-destructive",
};

/**
 * Compact metric tile: a small icon chip, an uppercase label, the figure, and
 * an optional hint. Designed to sit in a responsive grid inside a Card.
 *
 * The figure is tabular so a ticking value (uptime, device count) never nudges
 * the tiles beside it.
 */
export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  accent = "default",
  className,
}: {
  icon?: LucideIcon;
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  accent?: Accent;
  className?: string;
}) {
  return (
    <div className={cn("tile flex flex-col gap-2 p-3.5 sm:p-4", className)}>
      <div className="flex items-center gap-2">
        {Icon ? (
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
              accentChip[accent],
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
        <span className="eyebrow truncate">{label}</span>
      </div>
      <div
        className={cn(
          "tabular text-lg font-bold leading-tight sm:text-xl",
          accentText[accent],
        )}
      >
        {value}
      </div>
      {hint ? (
        <div className="-mt-1 truncate text-xs text-muted-foreground">
          {hint}
        </div>
      ) : null}
    </div>
  );
}
