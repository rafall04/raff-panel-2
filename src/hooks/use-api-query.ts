/**
 * React Hook for API queries with automatic execution
 * Similar to React Query but simpler
 */

import { useEffect, useState } from "react";
import { useApi } from "./use-api";
import type { ApiResponse } from "@/types/api";

interface UseApiQueryOptions {
  enabled?: boolean;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for API queries that execute automatically
 */
export function useApiQuery<T = unknown>(
  apiCall: (...args: unknown[]) => Promise<ApiResponse<T>>,
  args: unknown[] = [],
  options: UseApiQueryOptions = {},
) {
  const { enabled = true, onSuccess, onError } = options;
  const hook = useApi(apiCall);
  const [hasExecuted, setHasExecuted] = useState(false);

  useEffect(() => {
    if (enabled && !hasExecuted && !hook.loading && !hook.data && !hook.error) {
      setHasExecuted(true);
      void hook.execute(...args).then((data) => {
        if (data && onSuccess) {
          onSuccess(data);
        }
      });
    }
  }, [enabled, hasExecuted, hook, args, onSuccess]);

  useEffect(() => {
    if (hook.error && onError) {
      onError(hook.error);
    }
  }, [hook.error, onError]);

  return hook;
}
