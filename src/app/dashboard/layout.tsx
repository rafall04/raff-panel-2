"use client";

import React from "react";
import BottomNav from "./bottom.nav";
import ReportForm from "./report.form";
import { MessageSquareWarning, Router } from "lucide-react";
import { ModeToggle } from "./components/mode-toggle";
import { useWifiName } from "@/hooks/use-wifi-name";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReportDialogProvider, useReportDialog } from "./report-dialog-context";
import { SpeedOnDemandProvider } from "./speed-on-demand-context";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { wifiName, loading } = useWifiName();
  const companyName = loading ? "Memuat..." : wifiName || "WiFi Portal";
  const { isOpen, closeDialog } = useReportDialog();

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-brand-foreground shadow-brand-glow">
                <Router className="h-5 w-5" />
              </span>
              <div className="min-w-0 leading-tight">
                <p
                  className={`truncate text-sm font-bold ${loading ? "animate-pulse text-muted-foreground" : ""}`}
                >
                  {companyName}
                </p>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Portal Pelanggan
                </p>
              </div>
            </div>
            <ModeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-grow px-4 py-6 pb-28 sm:px-6 lg:px-8">
          {children}
        </main>

        <BottomNav />
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReportDialogProvider>
      <SpeedOnDemandProvider>
        <DashboardContent>{children}</DashboardContent>
      </SpeedOnDemandProvider>
    </ReportDialogProvider>
  );
}
