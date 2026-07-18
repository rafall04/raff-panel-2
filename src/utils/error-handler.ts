/**
 * Error Handling Utilities
 * Centralized error handling and user-friendly error messages
 */

import { ApiError } from "@/lib/api-client";
import { ServerApiError } from "@/lib/api-server";

export interface ErrorInfo {
  message: string;
  statusCode: number;
  code?: string;
  userMessage: string;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof ServerApiError) {
    return getUserFriendlyMessage(error);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Get user-friendly message based on error code
 */
function getUserFriendlyMessage(error: ApiError | ServerApiError): string {
  const { statusCode, code, message } = error;

  // Handle specific error codes
  if (code) {
    switch (code) {
      case "UNAUTHORIZED":
        return "You are not authorized to perform this action. Please log in again.";
      case "FORBIDDEN":
        return "You don't have permission to access this resource.";
      case "NOT_FOUND":
        return "The requested resource was not found.";
      case "VALIDATION_ERROR":
        return "Please check your input and try again.";
      case "NETWORK_ERROR":
        return "Network error. Please check your internet connection.";
      case "TIMEOUT":
        return "Request timed out. Please try again.";
      case "CONFIG_ERROR":
        return "Server configuration error. Please contact support.";
      default:
        break;
    }
  }

  // Handle HTTP status codes
  switch (statusCode) {
    case 400:
      return "Invalid request. Please check your input.";
    case 401:
      return "Authentication required. Please log in.";
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return "A conflict occurred. The resource may already exist.";
    case 422:
      return "Validation error. Please check your input.";
    case 429:
      return "Too many requests. Please try again later.";
    case 500:
      return "Server error. Please try again later.";
    case 502:
    case 503:
    case 504:
      return "Service temporarily unavailable. Please try again later.";
    default:
      return message || "An error occurred. Please try again.";
  }
}

/**
 * Get error info object
 */
export function getErrorInfo(error: unknown): ErrorInfo {
  if (error instanceof ApiError || error instanceof ServerApiError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      userMessage: getUserFriendlyMessage(error),
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 500,
      userMessage: "An unexpected error occurred. Please try again.",
    };
  }

  return {
    message: "Unknown error",
    statusCode: 500,
    userMessage: "An unexpected error occurred. Please try again.",
  };
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof ApiError || error instanceof ServerApiError) {
    return error.code === "NETWORK_ERROR" || error.statusCode === 0;
  }
  return false;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof ApiError || error instanceof ServerApiError) {
    return (
      error.code === "UNAUTHORIZED" ||
      error.statusCode === 401 ||
      error.statusCode === 403
    );
  }
  return false;
}

/**
 * Log error for debugging
 */
export function logError(error: unknown, context?: string): void {
  const errorInfo = getErrorInfo(error);

  console.error(`[${context || "Error"}]`, {
    message: errorInfo.message,
    statusCode: errorInfo.statusCode,
    code: errorInfo.code,
    error,
  });
}
