"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeedOnDemand } from "./speed-on-demand-context";
import { useTrafficUsageStatus } from "@/hooks/use-traffic-usage-status";
import { useVoucherStatus } from "@/hooks/use-voucher-status";
import { getNavGroups, splitForBottomBar, type NavItem } from "./nav-items";

function BarLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className="group relative flex flex-col items-center justify-center gap-1 pt-1"
    >
      <span
        className={cn(
          "flex h-8 w-14 items-center justify-center rounded-full transition-all duration-200",
          isActive
            ? "bg-brand/15 text-brand"
            : "text-muted-foreground group-active:scale-90",
        )}
      >
        <item.icon className="h-[21px] w-[21px]" />
      </span>
      <span
        className={cn(
          "max-w-full truncate px-0.5 text-[10px] font-medium leading-none transition-colors",
          isActive ? "font-semibold text-brand" : "text-muted-foreground",
        )}
      >
        {item.shortLabel ?? item.label}
      </span>
    </Link>
  );
}

/**
 * Mobile navigation (below lg). Capped at five slots — four destinations plus
 * an overflow sheet — because a bar that grows with every optional feature
 * ends up with unreadable 10px labels and sub-44px targets.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const { isEnabled: speedBoostEnabled } = useSpeedOnDemand();
  const { isEnabled: trafficEnabled } = useTrafficUsageStatus();
  const { isEnabled: voucherEnabled } = useVoucherStatus();
  const [sheetOpen, setSheetOpen] = useState(false);

  const { primary, overflow } = splitForBottomBar(
    getNavGroups({ speedBoostEnabled, trafficEnabled, voucherEnabled }),
  );

  // Navigating from inside the sheet must close it; the route changes under a
  // still-mounted overlay otherwise.
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  const overflowIsActive = overflow.some((item) => item.href === pathname);
  const columns = primary.length + (overflow.length > 0 ? 1 : 0);

  return (
    <>
      <nav
        aria-label="Navigasi utama"
        className="fixed bottom-0 left-0 z-40 w-full border-t border-border/70 bg-card pb-safe lg:hidden"
      >
        <div
          className="mx-auto grid h-16 w-full max-w-lg"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {primary.map((item) => (
            <BarLink
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}

          {overflow.length > 0 && (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={sheetOpen}
              className="group relative flex flex-col items-center justify-center gap-1 pt-1"
            >
              <span
                className={cn(
                  "flex h-8 w-14 items-center justify-center rounded-full transition-all duration-200",
                  overflowIsActive
                    ? "bg-brand/15 text-brand"
                    : "text-muted-foreground group-active:scale-90",
                )}
              >
                <MoreHorizontal className="h-[21px] w-[21px]" />
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none transition-colors",
                  overflowIsActive
                    ? "font-semibold text-brand"
                    : "text-muted-foreground",
                )}
              >
                Lainnya
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* Overflow sheet. Built on the Dialog primitive directly rather than the
          shared <Dialog>, which is centre-anchored — a menu launched from the
          bottom bar should animate up from where it was tapped. */}
      <DialogPrimitive.Root open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/65 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 lg:hidden" />
          <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[80dvh] overflow-y-auto rounded-t-2xl border-t bg-card px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 shadow-overlay duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom lg:hidden">
            {/* Grab handle: the standard affordance telling the customer this
                panel came from — and can be dismissed toward — the bottom. */}
            <div
              aria-hidden="true"
              className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border"
            />
            <DialogPrimitive.Title className="eyebrow px-1 pb-3">
              Menu Lainnya
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              Halaman lain di portal pelanggan.
            </DialogPrimitive.Description>

            <ul className="space-y-2">
              {overflow.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-3 transition-colors active:scale-[0.99]",
                        isActive
                          ? "border-brand/30 bg-brand/10"
                          : "border-border/70 bg-muted/40",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                          isActive
                            ? "bg-brand text-brand-foreground"
                            : "bg-card text-muted-foreground",
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-sm font-semibold",
                            isActive && "text-brand",
                          )}
                        >
                          {item.label}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
