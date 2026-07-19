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

/**
 * Compact metric tile: small labelled figure with an optional icon and hint.
 * Designed to sit in a responsive grid inside a Card.
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
    <div className={cn("tile flex flex-col gap-1.5", className)}>
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        <span className="truncate">{label}</span>
      </div>
      <div
        className={cn("text-xl font-bold leading-tight", accentText[accent])}
      >
        {value}
      </div>
      {hint ? (
        <div className="text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}
