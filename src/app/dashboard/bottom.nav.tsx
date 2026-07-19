"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wifi,
  Rocket,
  Settings,
  HelpCircle,
  History,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeedOnDemand } from "./speed-on-demand-context";
import { useTrafficUsageStatus } from "@/hooks/use-traffic-usage-status";

export default function BottomNav() {
  const pathname = usePathname();
  const { isEnabled } = useSpeedOnDemand();
  const { isEnabled: isTrafficEnabled } = useTrafficUsageStatus();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/wifi", label: "Wi-Fi", icon: Wifi },
    // PENTING: Conditional render berdasarkan isEnabled
    ...(isEnabled
      ? [{ href: "/dashboard/speed-boost", label: "Boost", icon: Rocket }]
      : []),
    ...(isTrafficEnabled
      ? [{ href: "/dashboard/traffic", label: "Traffic", icon: Activity }]
      : []),
    { href: "/dashboard/history", label: "History", icon: History },
    { href: "/dashboard/knowledge-base", label: "Bantuan", icon: HelpCircle },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full border-t border-border/60 bg-background/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div
        className="mx-auto grid h-16 w-full max-w-lg font-medium"
        style={{
          gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))`,
        }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className="group relative flex flex-col items-center justify-center gap-1"
            >
              <span
                className={cn(
                  "flex h-8 w-14 items-center justify-center rounded-full transition-all duration-200",
                  isActive
                    ? "bg-brand/15 text-brand"
                    : "text-muted-foreground group-hover:text-foreground group-active:scale-90",
                )}
              >
                <item.icon className="h-[22px] w-[22px]" />
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none transition-colors",
                  isActive
                    ? "text-brand"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
