"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wifi, MessageSquareWarning, Rocket } from 'lucide-react';

// This is a placeholder for the modal trigger function that will be passed as a prop.
type BottomNavProps = {
    onReportClick: () => void;
};

export default function BottomNav({ onReportClick }: BottomNavProps) {
    const pathname = usePathname();

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/dashboard/wifi', label: 'Wi-Fi', icon: Wifi },
        { href: '/dashboard/speed-boost', label: 'Boost', icon: Rocket },
    ];

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white/10 backdrop-blur-lg border-t border-white/20">
            <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
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
                <button type="button" onClick={onReportClick} className="inline-flex flex-col items-center justify-center px-5 hover:bg-white/5 group">
                    <MessageSquareWarning className="w-6 h-6 mb-1 text-gray-400 group-hover:text-white" />
                    <span className="text-sm text-gray-400 group-hover:text-white">Lapor</span>
                </button>
            </div>
        </div>
    );
}
