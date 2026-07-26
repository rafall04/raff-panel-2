import { cn } from "@/lib/utils";

/**
 * Loading placeholder. Uses a travelling sheen rather than a pulse — it reads
 * as "content is coming" instead of "this element is disabled", and it holds
 * the layout so nothing shifts when the real content lands.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("shimmer rounded-md bg-muted/70", className)}
      {...props}
    />
  );
}

export { Skeleton };
