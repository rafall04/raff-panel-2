"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wifi, Rocket, Settings, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/dashboard/wifi', label: 'Wi-Fi', icon: Wifi },
        { href: '/dashboard/speed-boost', label: 'Boost', icon: Rocket },
        { href: '/dashboard/knowledge-base', label: 'Bantuan', icon: HelpCircle },
        { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background/80 backdrop-blur-lg border-t">
            <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href} className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group rounded-lg">
                            <item.icon className={cn(
                                "w-6 h-6 mb-1 text-muted-foreground group-hover:text-foreground",
                                isActive && "text-primary"
                            )} />
                            <span className={cn(
                                "text-sm text-muted-foreground group-hover:text-foreground",
                                isActive && "text-primary"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
