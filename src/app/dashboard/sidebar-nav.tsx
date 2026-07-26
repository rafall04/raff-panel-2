"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquareWarning, Router } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./components/mode-toggle";
import { useReportDialog } from "./report-dialog-context";
import { useSpeedOnDemand } from "./speed-on-demand-context";
import { useTrafficUsageStatus } from "@/hooks/use-traffic-usage-status";
import { useVoucherStatus } from "@/hooks/use-voucher-status";
import { getNavGroups } from "./nav-items";

/**
 * Desktop navigation (lg and up). Large screens get a persistent sidebar rather
 * than the phone's bottom bar: it shows every destination at once — including
 * the ones the bar has to hide behind "Lainnya" — and keeps the brand present
 * on every page.
 *
 * Hidden below lg; the bottom bar takes over there.
 */
export default function SidebarNav({ companyName }: { companyName: string }) {
  const pathname = usePathname();
  const { openDialog } = useReportDialog();
  const { isEnabled: speedBoostEnabled } = useSpeedOnDemand();
  const { isEnabled: trafficEnabled } = useTrafficUsageStatus();
  const { isEnabled: voucherEnabled } = useVoucherStatus();

  const groups = getNavGroups({
    speedBoostEnabled,
    trafficEnabled,
    voucherEnabled,
  });

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-border/70 bg-card/70 lg:flex">
      {/* Brand */}
      <Link
        href="/dashboard"
        className="flex h-[72px] shrink-0 items-center gap-3 border-b border-border/70 px-5 transition-colors hover:bg-accent/40"
      >
        <span className="icon-chip-solid h-10 w-10">
          <Router className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-bold leading-tight tracking-tight">
            {companyName}
          </span>
          <span className="block text-[11px] text-muted-foreground">
            Portal Pelanggan
          </span>
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {groups.map((group) => (
          <div key={group.label} className="mb-6 last:mb-0">
            <p className="eyebrow px-3 pb-2">{group.label}</p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                        isActive
                          ? "bg-brand/12 font-semibold text-brand"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                      )}
                    >
                      {/* Active rail: a second, non-colour cue for the current
                          destination so it does not rely on the tint alone. */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand transition-opacity duration-200",
                          isActive ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-3 border-t border-border/70 p-3">
        <Button
          variant="outline"
          onClick={openDialog}
          className="w-full justify-start"
        >
          <MessageSquareWarning className="h-4 w-4" />
          Laporkan Masalah
        </Button>
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-xs text-muted-foreground">Tampilan</span>
          <ModeToggle />
        </div>
      </div>
    </aside>
  );
}
