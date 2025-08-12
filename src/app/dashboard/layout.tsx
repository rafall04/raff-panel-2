import React from 'react';
import BottomNav from './bottom.nav';
import ReportForm from './report.form';
import { MessageSquareWarning } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <input type="checkbox" id="report_modal_toggle" className="modal-toggle" />
      <div className="modal" role="dialog">
        <div className="modal-box bg-white/10 backdrop-blur-lg border border-white/20">
          <h3 className="font-bold text-lg text-white flex items-center"><MessageSquareWarning className="mr-2"/>Report an Issue</h3>
          <div className="py-4">
            <ReportForm />
          </div>
          <div className="modal-action">
            <label htmlFor="report_modal_toggle" className="btn">Close</label>
          </div>
        </div>
      </div>

      <div className="flex flex-col min-h-screen">
        <main className="flex-grow container mx-auto p-6 pb-24">
          {children}
        </main>
        <BottomNav />
      </div>
    </>
  );
}
