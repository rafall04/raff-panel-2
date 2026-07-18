/**
 * Data source untuk status Speed On Demand.
 *
 * JANGAN panggil hook ini langsung dari komponen — gunakan `useSpeedOnDemand`
 * dari `@/app/dashboard/speed-on-demand-context`. Hook ini menembak dua request
 * dan memasang interval, jadi setiap pemanggil menambah beban jaringan sendiri.
 * Provider-nya memanggil ini tepat sekali lalu membagikan hasilnya.
 *
 * Features:
 * - Polling berkala, dilewati saat tab tidak terlihat
 * - Refetch saat page visibility change (user kembali ke tab)
 * - Cache-busting untuk mencegah stale data
 * - Primary check menggunakan endpoint /api/speed-boost/status
 * - Fetch packages hanya jika feature enabled
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { SpeedBoostPackage } from "@/services/speed-boost.service";
interface SpeedBoostStatusApiResponse {
  success: boolean;
  data?: {
    enabled?: boolean;
  };
  message?: string;
}

export interface UseSpeedOnDemandReturn {
  packages: SpeedBoostPackage[];
  isEnabled: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSpeedOnDemandSource(): UseSpeedOnDemandReturn {
  const POLLING_INTERVAL_MS = 120000;
  const VISIBILITY_THROTTLE_MS = 15000;
  const [packages, setPackages] = useState<SpeedBoostPackage[]>([]);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef(0);

  const shouldSkipFetch = (isPolling: boolean) => {
    const now = Date.now();
    if (!isPolling && now - lastFetchRef.current < VISIBILITY_THROTTLE_MS) {
      return true;
    }
    lastFetchRef.current = now;
    return false;
  };

  const fetchSpeedBoost = useCallback(async (isPolling = false) => {
    if (shouldSkipFetch(isPolling)) {
      return;
    }

    try {
      // Only show loading on initial load, not during polling
      if (!isPolling) {
        setLoading(true);
      }
      setError(null);

      // STEP 1: Check feature status using dedicated endpoint
      // Add timestamp to prevent caching
      const statusRes = await fetch(`/api/speed-boost/status?t=${Date.now()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        cache: "no-store",
      });

      if (!statusRes.ok) {
        const errorData = await statusRes.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          `Failed to check Speed On Demand status: ${statusRes.status}`;
        setIsEnabled(false);
        setPackages([]);
        setError(errorMessage);
        return;
      }

      const rawResponse =
        (await statusRes.json()) as SpeedBoostStatusApiResponse;

      if (
        !rawResponse.success ||
        typeof rawResponse.data?.enabled !== "boolean"
      ) {
        setIsEnabled(false);
        setPackages([]);
        setError(
          rawResponse.message || "Invalid response format from status endpoint",
        );
        return;
      }

      const featureEnabled = rawResponse.data.enabled;

      // STEP 2: If feature is disabled, don't fetch packages
      if (!featureEnabled) {
        setIsEnabled(false);
        setPackages([]);
        setError(null);
        return;
      }

      // STEP 3: Feature is enabled, fetch available packages
      const packagesRes = await fetch(
        `/api/speed-boost/available?t=${Date.now()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
          cache: "no-store",
        },
      );

      if (!packagesRes.ok) {
        const errorData = await packagesRes.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          `Failed to fetch packages: ${packagesRes.status}`;
        setIsEnabled(true); // Feature is enabled, but packages fetch failed
        setPackages([]);
        setError(errorMessage);
        return;
      }

      const packagesResponse: {
        success: boolean;
        data?: SpeedBoostPackage[];
        message?: string;
      } = await packagesRes.json();

      if (!packagesResponse.success) {
        setIsEnabled(true); // Feature is enabled, but packages fetch failed
        setPackages([]);
        setError(packagesResponse.message || "Failed to fetch packages");
        return;
      }

      const packagesData = packagesResponse.data || [];

      setIsEnabled(true);
      setPackages(packagesData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setIsEnabled(false);
      setPackages([]);
      setError(errorMessage);
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    void fetchSpeedBoost(false);

    const intervalId = setInterval(() => {
      // Skip while backgrounded: this is a feature flag, and a phone in a
      // pocket has no use for it. The visibilitychange listener below catches
      // the user up when they return.
      if (document.visibilityState !== "visible") {
        return;
      }
      void fetchSpeedBoost(true);
    }, POLLING_INTERVAL_MS);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchSpeedBoost]);

  // Refetch when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchSpeedBoost(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchSpeedBoost]);

  // Refetch when window gets focus (user clicks back to window)
  useEffect(() => {
    const handleFocus = () => {
      void fetchSpeedBoost(false);
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchSpeedBoost]);

  return {
    packages,
    isEnabled,
    loading,
    error,
    refetch: () => fetchSpeedBoost(false),
  };
}
