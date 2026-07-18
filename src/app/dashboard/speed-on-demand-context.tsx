"use client";

import { createContext, useContext, ReactNode } from "react";
import {
  useSpeedOnDemandSource,
  type UseSpeedOnDemandReturn,
} from "@/hooks/use-speed-on-demand";

/**
 * Speed On Demand status is a global feature flag plus its package list — the
 * same answer for every component on the page. It used to be fetched by each
 * consumer independently (bottom nav + dashboard body + status card = three
 * concurrent pollers), so this provider fetches once and shares the result.
 */
const SpeedOnDemandContext = createContext<UseSpeedOnDemandReturn | undefined>(
  undefined,
);

export function SpeedOnDemandProvider({ children }: { children: ReactNode }) {
  const value = useSpeedOnDemandSource();

  return (
    <SpeedOnDemandContext.Provider value={value}>
      {children}
    </SpeedOnDemandContext.Provider>
  );
}

export function useSpeedOnDemand(): UseSpeedOnDemandReturn {
  const context = useContext(SpeedOnDemandContext);
  if (context === undefined) {
    throw new Error(
      "useSpeedOnDemand must be used within a SpeedOnDemandProvider",
    );
  }
  return context;
}
