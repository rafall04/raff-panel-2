/**
 * React Hook for API calls
 * Provides loading, error, and data states
 */

import { useState, useCallback } from "react";
import { ApiError } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
}

/**
 * Hook for making API calls
 */
export function useApi<T = unknown>(
  apiCall: (...args: unknown[]) => Promise<ApiResponse<T>>,
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiCall(...args);

        if (response.success && response.data !== undefined) {
          setState({
            data: response.data,
            loading: false,
            error: null,
          });
          return response.data;
        }

        throw new ApiError(
          response.message || "Request failed",
          400,
          "REQUEST_FAILED",
        );
      } catch (error) {
        const apiError =
          error instanceof ApiError
            ? error
            : new ApiError(
                error instanceof Error ? error.message : "An error occurred",
                500,
                "UNKNOWN_ERROR",
              );

        setState({
          data: null,
          loading: false,
          error: apiError,
        });

        return null;
      }
    },
    [apiCall],
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook for making API calls with immediate execution
 * Note: For immediate execution, use useEffect in your component
 */
export function useApiQuery<T = unknown>(
  apiCall: (...args: unknown[]) => Promise<ApiResponse<T>>,
): UseApiReturn<T> {
  return useApi(apiCall);
}
