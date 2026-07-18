"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import type { CustomerTrafficLive } from "@/services/customer-traffic.service";

interface UseCustomerTrafficLiveOptions {
  enabled: boolean;
  intervalMs?: number;
}

export function useCustomerTrafficLive({
  enabled,
  intervalMs = 10000,
}: UseCustomerTrafficLiveOptions) {
  const [data, setData] = useState<CustomerTrafficLive | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchLive = useCallback(async () => {
    if (!enabled) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      const response = await apiClient.get<CustomerTrafficLive>(
        `/api/traffic-live?t=${Date.now()}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
          timeout: 15000,
        },
      );
      setData(response.data || null);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengambil bandwidth live.",
      );
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const runFetch = () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
      ) {
        return;
      }
      void fetchLive();
    };

    runFetch();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchLive();
      }
    };

    intervalId = setInterval(runFetch, intervalMs);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, fetchLive, intervalMs]);

  return {
    data,
    loading,
    error,
    refetch: fetchLive,
  };
}
