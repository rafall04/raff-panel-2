"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wifi, Rocket, Settings, HelpCircle } from 'lucide-react';

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
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white/10 backdrop-blur-lg border-t border-white/20">
            <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href} className="inline-flex flex-col items-center justify-center px-5 hover:bg-white/5 group">
                            <item.icon className={`w-6 h-6 mb-1 ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-white'}`} />
                            <span className={`text-sm ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-white'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
