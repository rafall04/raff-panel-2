/**
 * Announcement Service
 * Handles all announcement-related API calls
 */

import { serverApiClient } from "@/lib/api-server";
import type { ApiResponse } from "@/types/api";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: "low" | "medium" | "high";
  publishedAt: string;
  expiresAt?: string;
}

export class AnnouncementService {
  /**
   * Get active announcements
   */
  static async getActiveAnnouncements(): Promise<ApiResponse<Announcement[]>> {
    return serverApiClient.get<Announcement[]>("/api/announcements", {
      requireAuth: false,
    });
  }
}
