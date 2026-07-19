import React from "react";
import { getCompanyName } from "./actions";
import DashboardShell from "./dashboard-shell";

// getCompanyName reads the session cookie (per-tenant brand), so this layout is
// request-time dynamic. It caches for an hour and falls back on its own.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const companyName = await getCompanyName();

  return <DashboardShell companyName={companyName}>{children}</DashboardShell>;
}
