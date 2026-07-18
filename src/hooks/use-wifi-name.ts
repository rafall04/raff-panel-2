/**
 * Hook untuk fetch WiFi name dari public endpoint
 * Endpoint: GET /api/wifi-name (public, tidak perlu authentication)
 */

import { useState, useEffect } from "react";

interface WiFiNameResponse {
  status: number;
  message: string;
  data: {
    wifiName: string;
  };
}

interface UseWifiNameReturn {
  wifiName: string;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWifiName(): UseWifiNameReturn {
  const [wifiName, setWifiName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWifiName = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/wifi-name", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message || `Failed to fetch WiFi name: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data: WiFiNameResponse = await response.json();

      if (data.status === 200 && data.data.wifiName) {
        setWifiName(data.data.wifiName);
        setError(null);
      } else {
        throw new Error(data.message || "Failed to fetch WiFi name");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error fetching WiFi name:", err);
      setError(errorMessage);
      setWifiName("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchWifiName();
  }, []);

  return {
    wifiName,
    loading,
    error,
    refetch: fetchWifiName,
  };
}
