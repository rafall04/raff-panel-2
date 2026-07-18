/**
 * News Service
 * Handles all news-related API calls
 */

import { serverApiClient } from "@/lib/api-server";
import type { ApiResponse } from "@/types/api";

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  publishedAt: string;
  author?: string;
}

export class NewsService {
  /**
   * Get news list
   */
  static async getNews(): Promise<ApiResponse<NewsItem[]>> {
    return serverApiClient.get<NewsItem[]>("/api/news", {
      requireAuth: false,
    });
  }

  /**
   * Get single news item
   */
  static async getNewsById(id: string): Promise<ApiResponse<NewsItem>> {
    return serverApiClient.get<NewsItem>(`/api/news/${id}`, {
      requireAuth: false,
    });
  }
}
