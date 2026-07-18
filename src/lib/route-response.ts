import { NextResponse } from "next/server";
import { ServerApiError } from "@/lib/api-server";
import type { ApiResponse } from "@/types/api";
import { logPortalServerEvent } from "@/lib/server-log";

type HeaderMode = "no-store" | "revalidate";

function buildHeaders(mode: HeaderMode = "no-store"): Record<string, string> {
  if (mode === "revalidate") {
    return {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    };
  }

  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    Pragma: "no-cache",
    Expires: "0",
  };
}

export function routeSuccess<T>(
  data: T,
  message?: string,
  options: { status?: number; cache?: HeaderMode } = {},
) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    {
      status: options.status ?? 200,
      headers: buildHeaders(options.cache),
    },
  );
}

export function routeError(
  message: string,
  options: {
    status?: number;
    code?: string;
    cache?: HeaderMode;
    event?: string;
    context?: Record<string, unknown>;
  } = {},
) {
  if (options.event) {
    logPortalServerEvent("error", options.event, options.context);
  }

  return NextResponse.json(
    {
      success: false,
      message,
      code: options.code,
    },
    {
      status: options.status ?? 500,
      headers: buildHeaders(options.cache),
    },
  );
}

export function routeFromApiResponse<T>(
  response: ApiResponse<T>,
  options: {
    fallbackMessage: string;
    cache?: HeaderMode;
    badRequestStatus?: number;
  },
) {
  if (!response.success || response.data === undefined) {
    return routeError(response.message || options.fallbackMessage, {
      status: response.error ? 500 : (options.badRequestStatus ?? 400),
      cache: options.cache,
    });
  }

  return routeSuccess(response.data, response.message, {
    cache: options.cache,
  });
}

export function routeFromServerError(
  error: unknown,
  fallbackMessage: string,
  event: string,
  context: Record<string, unknown> = {},
  options: { cache?: HeaderMode } = {},
) {
  if (error instanceof ServerApiError) {
    return routeError(error.message || fallbackMessage, {
      status: error.statusCode,
      code: error.code,
      cache: options.cache,
      event,
      context: {
        ...context,
        statusCode: error.statusCode,
        code: error.code,
      },
    });
  }

  return routeError(fallbackMessage, {
    status: 500,
    cache: options.cache,
    event,
    context: {
      ...context,
      error: error instanceof Error ? error.message : "unknown_error",
    },
  });
}
