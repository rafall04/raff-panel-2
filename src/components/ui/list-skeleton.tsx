import { Skeleton } from "./skeleton";

/**
 * Placeholder rows shaped like a list item (icon + two lines + trailing badge).
 * Use in the loading state of card lists instead of a spinner.
 */
export function ListSkeleton({
  rows = 4,
  trailing = true,
}: {
  rows?: number;
  trailing?: boolean;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="tile flex items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          {trailing ? (
            <Skeleton className="h-6 w-14 shrink-0 rounded-full" />
          ) : null}
        </div>
      ))}
    </div>
  );
}
