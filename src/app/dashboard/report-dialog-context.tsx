"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ReportDialogContextType {
  openDialog: () => void;
  closeDialog: () => void;
  isOpen: boolean;
}

const ReportDialogContext = createContext<ReportDialogContextType | undefined>(
  undefined,
);

export function ReportDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = () => {
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
  };

  return (
    <ReportDialogContext.Provider value={{ openDialog, closeDialog, isOpen }}>
      {children}
    </ReportDialogContext.Provider>
  );
}

export function useReportDialog() {
  const context = useContext(ReportDialogContext);
  if (context === undefined) {
    throw new Error(
      "useReportDialog must be used within a ReportDialogProvider",
    );
  }
  return context;
}
