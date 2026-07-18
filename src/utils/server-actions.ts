/**
 * Server Actions Utilities
 * Helper functions for creating server actions with proper error handling
 */

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getErrorInfo } from "./error-handler";
import type { ApiResponse } from "@/types/api";

export interface ServerActionResult<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * Wrap server action with error handling
 */
export async function createServerAction<T = unknown>(
  action: () => Promise<ApiResponse<T>>,
  options?: {
    revalidatePaths?: string[];
    revalidateTags?: string[];
    redirectOnSuccess?: string;
    successMessage?: string;
  },
): Promise<ServerActionResult<T>> {
  try {
    const response = await action();

    if (response.success && response.data !== undefined) {
      if (options?.revalidatePaths) {
        options.revalidatePaths.forEach((path) => revalidatePath(path));
      }

      if (options?.revalidateTags) {
        options.revalidateTags.forEach((tag) => revalidateTag(tag));
      }

      // Redirect if specified
      if (options?.redirectOnSuccess) {
        redirect(options.redirectOnSuccess);
      }

      return {
        success: true,
        data: response.data,
        message: options?.successMessage || response.message || "Success",
      };
    }

    return {
      success: false,
      message: response.message || "An error occurred",
      error: response.error,
      errors: response.errors,
    };
  } catch (error) {
    const errorInfo = getErrorInfo(error);

    return {
      success: false,
      message: errorInfo.userMessage,
      error: errorInfo.message,
    };
  }
}

/**
 * Create form action with FormData handling
 */
export async function createFormAction<T = unknown>(
  action: (formData: FormData) => Promise<ApiResponse<T>>,
  options?: {
    revalidatePaths?: string[];
    revalidateTags?: string[];
    redirectOnSuccess?: string;
    successMessage?: string;
  },
) {
  return async (formData: FormData): Promise<ServerActionResult<T>> => {
    return createServerAction(() => action(formData), options);
  };
}
