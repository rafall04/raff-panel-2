"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BottomNav from "./bottom.nav";
import SidebarNav from "./sidebar-nav";
import ReportForm from "./report.form";
import { MessageSquareWarning, Router } from "lucide-react";
import { ModeToggle } from "./components/mode-toggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReportDialogProvider, useReportDialog } from "./report-dialog-context";
import { SpeedOnDemandProvider } from "./speed-on-demand-context";

function DashboardContent({
  companyName,
  children,
}: {
  companyName: string;
  children: React.ReactNode;
}) {
  const { isOpen, closeDialog } = useReportDialog();
  const pathname = usePathname();

  return (
    <>
      {/* Adaptive shell: persistent sidebar from lg up, bottom bar below it.
          The left padding reserves the sidebar's column so fixed positioning
          never overlaps content. */}
      <div className="min-h-dvh lg:pl-[264px]">
        <SidebarNav companyName={companyName} />

        {/* Mobile/tablet top bar. Hidden on desktop, where the sidebar already
            carries the brand and there is nothing left for it to say. */}
        <header className="sticky top-0 z-30 w-full border-b border-border/70 bg-card pt-[env(safe-area-inset-top)] lg:hidden">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-gutter">
            <Link
              href="/dashboard"
              className="flex min-w-0 flex-1 items-center gap-2.5"
            >
              <span className="icon-chip-solid h-10 w-10">
                <Router className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-bold leading-tight tracking-tight">
                  {companyName}
                </span>
                <span className="block text-[11px] leading-tight text-muted-foreground">
                  Portal Pelanggan
                </span>
              </span>
            </Link>
            <ModeToggle />
          </div>
          {/* Hairline of brand light along the header edge — the one flourish
              that stops the bar reading as a plain white block. */}
          <div
            aria-hidden="true"
            className="h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent"
          />
        </header>

        {/* pb-28 clears the fixed bottom bar on mobile; on desktop the bar is
            gone, so the padding drops back to normal page spacing. */}
        <main className="mx-auto w-full max-w-6xl px-gutter pb-28 pt-5 lg:pb-14 lg:pt-9">
          {/* Keyed on the path so each navigation replays the entrance — the
              spatial cue that the page actually changed. */}
          <div key={pathname} className="animate-fade-up">
            {children}
          </div>
        </main>

        <BottomNav />
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              <span className="icon-chip h-9 w-9">
                <MessageSquareWarning className="h-[18px] w-[18px]" />
              </span>
              Laporkan Masalah
            </DialogTitle>
            <DialogDescription>
              Ceritakan kendala koneksi Anda. Tim kami akan menindaklanjuti
              secepatnya.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-1">
            <ReportForm onSuccess={closeDialog} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function DashboardShell({
  companyName,
  children,
}: {
  companyName: string;
  children: React.ReactNode;
}) {
  return (
    <ReportDialogProvider>
      <SpeedOnDemandProvider>
        <DashboardContent companyName={companyName}>
          {children}
        </DashboardContent>
      </SpeedOnDemandProvider>
    </ReportDialogProvider>
  );
}
