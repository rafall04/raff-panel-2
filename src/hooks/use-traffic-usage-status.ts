import { useCallback, useEffect, useState } from "react";

interface TrafficUsageStatusApiResponse {
  success: boolean;
  data?: {
    enabled?: boolean;
    usageEnabled?: boolean;
    liveEnabled?: boolean;
  };
  message?: string;
}

export function useTrafficUsageStatus() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLiveEnabled, setIsLiveEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/traffic-usage/status?t=${Date.now()}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        },
      );

      if (!response.ok) {
        setIsEnabled(false);
        return;
      }

      const payload = (await response.json()) as TrafficUsageStatusApiResponse;
      const usageEnabled =
        payload.success &&
        (payload.data?.usageEnabled === true || payload.data?.enabled === true);
      setIsEnabled(usageEnabled);
      setIsLiveEnabled(payload.success && payload.data?.liveEnabled === true);
    } catch {
      setIsEnabled(false);
      setIsLiveEnabled(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  return { isEnabled, isLiveEnabled, loading, refetch: fetchStatus };
}
