import React from 'react';
import BottomNav from './bottom.nav';
import ReportForm from './report.form';
import { MessageSquareWarning } from 'lucide-react';
import { ModeToggle } from './components/mode-toggle';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Dialog>
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <div className="flex-1">
                    <p className="font-bold">RAF-CYBER.NET</p>
                </div>
                <ModeToggle />
            </div>
        </header>

        <main className="flex-grow container mx-auto p-6 pb-24">
          {children}
        </main>

        <BottomNav />
      </div>

      <DialogContent>
          <DialogHeader>
              <DialogTitle className="flex items-center">
                  <MessageSquareWarning className="mr-2"/>Report an Issue
              </DialogTitle>
              <DialogDescription>
                  Please fill out the form below to report an issue with your connection.
              </DialogDescription>
          </DialogHeader>
          <div className="py-4">
              <ReportForm />
          </div>
      </DialogContent>
    </Dialog>
  );
}
