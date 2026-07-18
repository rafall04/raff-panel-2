/**
 * API Response Types
 * Centralized type definitions for API requests and responses
 */

export interface BackendApiResponse<T = unknown> {
  status: number;
  message: string;
  data: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

// Paginated Response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Error Response
export interface ApiErrorResponse {
  status?: number;
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
  code?: string;
}

// Request Options
export interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
  timeout?: number;
}

// HTTP Methods
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
