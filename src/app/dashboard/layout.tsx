"use client";

import React, { useState } from 'react';
import BottomNav from './bottom.nav';
import ReportForm from './report.form';
import { MessageSquareWarning } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isReportModalOpen, setReportModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow container mx-auto p-6 pb-24">
          {children}
        </main>
        <BottomNav onReportClick={() => setReportModalOpen(true)} />
      </div>

      <dialog id="report_modal" className="modal" open={isReportModalOpen}>
          <div className="modal-box bg-white/10 backdrop-blur-lg border border-white/20">
              <h3 className="font-bold text-lg text-white flex items-center"><MessageSquareWarning className="mr-2"/>Report an Issue</h3>
              <div className="py-4">
                  <ReportForm />
              </div>
              <div className="modal-action">
                  <button className="btn" onClick={() => setReportModalOpen(false)}>Close</button>
              </div>
          </div>
      </dialog>
    </>
  );
}
