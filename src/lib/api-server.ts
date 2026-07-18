/**
 * Server-side API Client
 * Optimized for server components and server actions
 */

import type { ApiResponse, RequestOptions } from "@/types/api";
import { getBackendContext, getPublicBackendBaseUrl } from "@/lib/auth";

class ServerApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ServerApiError";
  }
}

/**
 * How long to wait on raf-bot-v2 before giving up.
 *
 * This client used to have no timeout at all — documented as deliberate
 * ("server-to-server"). That reasoning does not hold here: raf-bot-v2 reaches
 * GenieACS over TR-069 and MikroTik by spawning a PHP process, and it has a
 * circuit breaker that can sit open. When it stalls, an unbounded fetch pins a
 * Next.js request until undici's ~5 minute default, the customer stares at a
 * spinner, and under load the panel runs out of capacity waiting on a backend
 * that already gave up.
 *
 * 15s is above the backend's own internal ceilings (MikroTik ~12s) so we do not
 * cut off work that would have succeeded.
 */
const DEFAULT_TIMEOUT_MS = 15000;

class ServerApiClient {
  /**
   * Resolve the backend base URL and auth headers for a single request.
   *
   * The base URL is per-request, not a constructor constant: this panel is
   * multi-tenant, so which raf-bot-v2 to hit depends on the caller's session
   * (its pinned `site`). Authenticated calls read both site and token from the
   * JWT in one shot; public calls (`requireAuth: false`) resolve the site from
   * the session when present, else the pre-login preferred site.
   */
  private async resolveRequest(
    requireAuth: boolean,
  ): Promise<{ baseUrl: string; headers: HeadersInit }> {
    if (!requireAuth) {
      return {
        baseUrl: await getPublicBackendBaseUrl(),
        headers: { "Content-Type": "application/json" },
      };
    }

    const ctx = await getBackendContext();
    if (!ctx) {
      throw new ServerApiError(
        "User not authenticated or token not found",
        401,
        "UNAUTHORIZED",
      );
    }

    return {
      baseUrl: ctx.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ctx.token}`,
      },
    };
  }

  /**
   * Normalize backend response to frontend format
   * Backend format: { status: number, message: string, data: T }
   * Frontend format: { success: boolean, data?: T, message?: string }
   */
  private normalizeResponse<T>(backendResponse: unknown): ApiResponse<T> {
    // Check if it's backend format: { status, message, data }
    if (
      typeof backendResponse === "object" &&
      backendResponse !== null &&
      "status" in backendResponse &&
      "message" in backendResponse &&
      "data" in backendResponse
    ) {
      const backend = backendResponse as {
        status: number;
        message: string;
        data: T;
        error?: string;
        errors?: Record<string, string[]>;
      };

      return {
        success: backend.status >= 200 && backend.status < 300,
        data: backend.data,
        message: backend.message,
        error: backend.error,
        errors: backend.errors,
      };
    }

    // Check if it's already frontend format: { success, data }
    if (
      typeof backendResponse === "object" &&
      backendResponse !== null &&
      ("success" in backendResponse || "data" in backendResponse)
    ) {
      return backendResponse as ApiResponse<T>;
    }

    // Fallback: wrap raw data
    return {
      success: true,
      data: backendResponse as T,
    };
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    let data: unknown;
    try {
      data = isJson ? await response.json() : await response.text();
    } catch (_error) {
      throw new ServerApiError(
        "Failed to parse response",
        response.status,
        "PARSE_ERROR",
      );
    }

    if (!response.ok) {
      const errorData = data as {
        status?: number;
        message?: string;
        error?: string;
        errors?: Record<string, string[]>;
        code?: string;
      };

      throw new ServerApiError(
        errorData.message || errorData.error || "An error occurred",
        errorData.status || response.status,
        errorData.code,
        errorData.errors,
      );
    }

    // Normalize response to frontend format
    if (isJson && typeof data === "object" && data !== null) {
      return this.normalizeResponse<T>(data);
    }

    return {
      success: true,
      data: data as T,
    };
  }

  /**
   * Make authenticated API request
   */
  async request<T = unknown>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    let baseUrl: string;
    let headers: HeadersInit;
    try {
      ({ baseUrl, headers } = await this.resolveRequest(
        options.requireAuth !== false,
      ));
    } catch (error) {
      if (error instanceof ServerApiError) {
        throw error;
      }
      // getSiteApiUrl throws when a site's URL is unconfigured — a deploy
      // misconfiguration. Surface as 500 without echoing the internal host.
      throw new ServerApiError(
        "API URL is not configured",
        500,
        "CONFIG_ERROR",
      );
    }

    const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const timeoutMs = options.timeout ?? DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        signal: controller.signal,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ServerApiError) {
        throw error;
      }

      // A timeout is upstream being slow, not the customer doing anything wrong,
      // so it gets 504 rather than being flattened into a generic 500.
      if (error instanceof Error && error.name === "AbortError") {
        throw new ServerApiError(
          "Server sedang lambat merespons. Silakan coba lagi sebentar lagi.",
          504,
          "TIMEOUT",
        );
      }

      throw new ServerApiError(
        error instanceof Error ? error.message : "An unexpected error occurred",
        500,
        "UNKNOWN_ERROR",
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * GET request
   */
  async get<T = unknown>(
    endpoint: string,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "GET",
    });
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(
    endpoint: string,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "DELETE",
    });
  }
}

// Export singleton instance
export const serverApiClient = new ServerApiClient();

// Export error class
export { ServerApiError };
