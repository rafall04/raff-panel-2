"use client";

import Link from "next/link";
import { Wifi, MessageSquareWarning, History, HelpCircle } from "lucide-react";
import { useReportDialog } from "./report-dialog-context";

const TILE =
  "flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-3 text-center shadow-card transition-all hover:bg-accent/40 active:scale-[0.97]";
const CHIP =
  "flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand";

export default function QuickActions() {
  const { openDialog } = useReportDialog();

  return (
    <div className="grid grid-cols-4 gap-3">
      <Link href="/dashboard/wifi" className={TILE}>
        <span className={CHIP}>
          <Wifi className="h-5 w-5" />
        </span>
        <span className="text-xs font-medium">Ubah WiFi</span>
      </Link>
      <button type="button" onClick={openDialog} className={TILE}>
        <span className={CHIP}>
          <MessageSquareWarning className="h-5 w-5" />
        </span>
        <span className="text-xs font-medium">Lapor</span>
      </button>
      <Link href="/dashboard/history" className={TILE}>
        <span className={CHIP}>
          <History className="h-5 w-5" />
        </span>
        <span className="text-xs font-medium">Riwayat</span>
      </Link>
      <Link href="/dashboard/knowledge-base" className={TILE}>
        <span className={CHIP}>
          <HelpCircle className="h-5 w-5" />
        </span>
        <span className="text-xs font-medium">Bantuan</span>
      </Link>
    </div>
  );
}
