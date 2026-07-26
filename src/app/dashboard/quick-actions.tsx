"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Wifi, MessageSquareWarning, History, HelpCircle } from "lucide-react";
import { useReportDialog } from "./report-dialog-context";

/**
 * Four-up shortcut grid. Stays 4 columns at every width — the tiles are the
 * app's "home row", and reflowing them would move a target the customer has
 * learned the position of.
 */
const TILE =
  "group flex flex-col items-center justify-center gap-2.5 rounded-xl border bg-card p-3 text-center shadow-xs transition-all duration-200 hover:border-brand/35 hover:shadow-card active:scale-[0.97]";

function TileBody({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-inset ring-brand/15 transition-colors duration-200 group-hover:bg-brand group-hover:text-brand-foreground group-hover:ring-brand">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-[11px] font-semibold leading-tight sm:text-xs">
        {label}
      </span>
    </>
  );
}

export default function QuickActions() {
  const { openDialog } = useReportDialog();

  return (
    <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
      <Link href="/dashboard/wifi" className={TILE}>
        <TileBody icon={Wifi} label="Ubah WiFi" />
      </Link>
      <button type="button" onClick={openDialog} className={TILE}>
        <TileBody icon={MessageSquareWarning} label="Lapor" />
      </button>
      <Link href="/dashboard/history" className={TILE}>
        <TileBody icon={History} label="Riwayat" />
      </Link>
      <Link href="/dashboard/knowledge-base" className={TILE}>
        <TileBody icon={HelpCircle} label="Bantuan" />
      </Link>
    </div>
  );
}
