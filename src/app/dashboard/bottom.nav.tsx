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
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background/80 backdrop-blur-lg border-t">
      <div
        className="grid h-full max-w-lg mx-auto font-medium"
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
              className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group rounded-lg"
            >
              <item.icon
                className={cn(
                  "w-6 h-6 mb-1 text-muted-foreground group-hover:text-foreground",
                  isActive && "text-primary",
                )}
              />
              <span
                className={cn(
                  "text-sm text-muted-foreground group-hover:text-foreground",
                  isActive && "text-primary",
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
