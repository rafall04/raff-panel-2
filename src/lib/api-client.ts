/**
 * API Client
 * Client-side API client for local Next.js routes only.
 */

import type { ApiResponse, RequestOptions } from "@/types/api";

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

class ApiClient {
  private defaultHeaders: HeadersInit;

  constructor() {
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  /**
   * Build request headers
   */
  private async buildHeaders(
    options: RequestOptions = {},
  ): Promise<HeadersInit> {
    const headers: HeadersInit = {
      ...this.defaultHeaders,
      ...options.headers,
    };

    return headers;
  }

  private buildUrl(endpoint: string): string {
    if (/^https?:\/\//i.test(endpoint)) {
      throw new ApiError(
        "External API URLs are blocked in the browser. Use a local route or server action instead.",
        400,
        "EXTERNAL_URL_BLOCKED",
      );
    }

    return endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
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
      throw new ApiError(
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

      throw new ApiError(
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
   * Make API request with timeout
   */
  private async requestWithTimeout(
    url: string,
    options: RequestOptions,
    timeout: number = 30000,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiError("Request timeout", 408, "TIMEOUT");
      }
      throw error;
    }
  }

  /**
   * Make API request
   */
  async request<T = unknown>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const headers = await this.buildHeaders(options);
    const timeout = options.timeout || 30000;

    try {
      const response = await this.requestWithTimeout(
        url,
        {
          ...options,
          headers,
        },
        timeout,
      );

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new ApiError(
          "Network error. Please check your connection.",
          0,
          "NETWORK_ERROR",
        );
      }

      throw new ApiError(
        error instanceof Error ? error.message : "An unexpected error occurred",
        500,
        "UNKNOWN_ERROR",
      );
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
export const apiClient = new ApiClient();

// Export error class
export { ApiError };
