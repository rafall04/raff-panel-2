import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Friendly empty/placeholder block: a circled icon, a title, an optional
 * description and action. Replaces bare "no data" text so empty screens still
 * feel designed.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "muted",
  className,
}: {
  icon: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  tone?: "muted" | "brand";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/25 px-6 py-10 text-center",
        className,
      )}
    >
      <span
        className={cn(
          "mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl",
          tone === "brand"
            ? "bg-brand/12 text-brand ring-1 ring-inset ring-brand/20"
            : "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
        )}
      >
        <Icon className="h-6 w-6" />
      </span>
      <p className="font-semibold">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
