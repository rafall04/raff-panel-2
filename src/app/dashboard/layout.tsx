"use client";

import React from "react";
import BottomNav from "./bottom.nav";
import ReportForm from "./report.form";
import { MessageSquareWarning } from "lucide-react";
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
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="flex-1">
              <p className="font-bold">{companyName}</p>
            </div>
            <ModeToggle />
          </div>
        </header>

        <main className="flex-grow container mx-auto p-6 pb-24">
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
