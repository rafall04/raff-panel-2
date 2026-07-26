import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Consistent page title block: a gradient icon chip, an optional eyebrow, a
 * bold title, an optional subtitle, and an optional trailing action.
 *
 * The action drops below the title on phones and sits inline from sm up, so a
 * long title and a button never fight for the same row at 375px.
 */
export function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        {Icon ? (
          <span className="icon-chip-solid h-12 w-12">
            <Icon className="h-[22px] w-[22px]" />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          {eyebrow ? <p className="eyebrow mb-1">{eyebrow}</p> : null}
          <h1 className="truncate text-xl font-bold leading-tight sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/**
 * Divider between groups of cards on a long page. Quieter than a PageHeader —
 * it is an h2 in the document outline, not a second page title.
 */
export function SectionHeading({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-4 gap-y-1",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
