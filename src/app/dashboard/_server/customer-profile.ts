import { cache } from "react";
import type { CustomerInfo } from "../types";
import { logPortalServerEvent } from "@/lib/server-log";

/**
 * Customer profile, memoized for the duration of one server render.
 *
 * Several server actions need the profile within a single page render
 * (dashboard-data and getWifiPageData both did their own fetch), so this is
 * deduped with React.cache. Concurrent callers share one in-flight promise,
 * which means callers can sit inside the same Promise.all without costing an
 * extra round trip to raf-bot-v2.
 *
 * This lives outside customer-actions.ts because a "use server" module may only
 * export async functions, and cache() returns a plain one.
 */
export const getCustomerProfile = cache(
  async (): Promise<CustomerInfo | null> => {
    try {
      const { CustomerService } = await import("@/services/customer.service");
      const response = await CustomerService.getProfile();

      if (!response.success || !response.data) {
        logPortalServerEvent("warn", "customer_profile_fetch_failed", {
          domain: "profile",
          message: response.message || "missing_profile_data",
        });
        return null;
      }

      const data = response.data;
      if (!Array.isArray(data.allowed_ssids)) {
        data.allowed_ssids = [];
      }

      return data as CustomerInfo;
    } catch (error) {
      logPortalServerEvent("error", "customer_profile_fetch_error", {
        domain: "profile",
        error: error instanceof Error ? error.message : "unknown_error",
      });
      return null;
    }
  },
);
