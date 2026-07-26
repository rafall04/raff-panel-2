import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "brand" | "success" | "warning" | "destructive" | "muted";

const toneChip: Record<Tone, string> = {
  brand: "bg-brand/12 text-brand ring-brand/20",
  success: "bg-success/12 text-success ring-success/20",
  warning: "bg-warning/12 text-warning ring-warning/20",
  destructive: "bg-destructive/12 text-destructive ring-destructive/20",
  muted: "bg-muted text-muted-foreground ring-border",
};

/**
 * Vertical activity timeline, shared by every tab of the Riwayat page.
 *
 * Before this, each history list invented its own row layout and the four tabs
 * looked like four different products. The connector rail also does real work:
 * it tells the customer these entries are one chronological series.
 */
export function Timeline({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <ol className={cn("relative", className)}>{children}</ol>;
}

export function TimelineItem({
  icon: Icon,
  tone = "muted",
  title,
  meta,
  trailing,
  children,
  isLast = false,
}: {
  icon: LucideIcon;
  tone?: Tone;
  title: React.ReactNode;
  meta?: React.ReactNode;
  /** Right-aligned slot: a status badge, an amount, or both stacked. */
  trailing?: React.ReactNode;
  children?: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <li className={cn("relative flex gap-3.5", isLast ? "pb-0" : "pb-5")}>
      {/* Rail. Starts below the chip and stops at the next one, so it reads as
          a connector rather than a border running through the icons. */}
      {!isLast ? (
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-[19px] top-11 w-px bg-border"
        />
      ) : null}

      <span
        className={cn(
          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
          toneChip[tone],
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>

      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="break-words text-sm font-semibold leading-snug">
              {title}
            </div>
            {meta ? (
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                {meta}
              </div>
            ) : null}
          </div>
          {trailing ? (
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {trailing}
            </div>
          ) : null}
        </div>
        {children ? <div className="mt-2.5">{children}</div> : null}
      </div>
    </li>
  );
}
