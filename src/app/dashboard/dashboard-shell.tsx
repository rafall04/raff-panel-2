"use client";

import React from "react";
import { usePathname } from "next/navigation";
import BottomNav from "./bottom.nav";
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
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-brand-foreground shadow-brand-glow">
                <Router className="h-5 w-5" />
              </span>
              <span className="truncate text-lg font-bold tracking-tight">
                {companyName}
              </span>
            </div>
            <ModeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-grow px-4 py-6 pb-28 sm:px-6 lg:px-8">
          <div
            key={pathname}
            className="duration-300 animate-in fade-in-0 slide-in-from-bottom-2"
          >
            {children}
          </div>
        </main>

        <BottomNav />
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <MessageSquareWarning className="mr-2 h-5 w-5" />
              Laporkan Masalah
            </DialogTitle>
            <DialogDescription className="text-sm">
              Mohon isi formulir di bawah ini untuk melaporkan masalah terkait
              koneksi Anda.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
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
