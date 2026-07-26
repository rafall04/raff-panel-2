import { useCallback, useEffect, useState } from "react";

interface VoucherStatusApiResponse {
  success: boolean;
  data?: { enabled?: boolean };
  message?: string;
}

/**
 * Apakah pembelian voucher tersedia untuk site pelanggan ini.
 *
 * Fail-closed: kegagalan apa pun (jaringan, 5xx, payload aneh) berarti `false`, sehingga
 * menu Voucher tidak pernah muncul untuk site yang tidak mengaktifkannya.
 */
export function useVoucherStatus() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/vouchers/status?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      });

      if (!response.ok) {
        setIsEnabled(false);
        return;
      }

      const payload = (await response.json()) as VoucherStatusApiResponse;
      setIsEnabled(payload.success && payload.data?.enabled === true);
    } catch {
      setIsEnabled(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  return { isEnabled, loading, refetch: fetchStatus };
}
