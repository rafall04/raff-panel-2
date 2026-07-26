import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Label/value pair with a leading icon — the detail-list row used by the
 * subscription card and the settings profile. Values wrap rather than truncate
 * (addresses are long), and the icon column keeps every row optically aligned.
 */
export function InfoRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: LucideIcon;
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="eyebrow">{label}</p>
        <div className="mt-0.5 break-words text-sm font-medium">
          {value || "—"}
        </div>
      </div>
    </div>
  );
}
