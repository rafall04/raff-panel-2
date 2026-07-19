"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { Newspaper } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO 8601 date string
}

interface NewsResponse {
  success: boolean;
  data: NewsItem[];
  message?: string;
}

// Helper function to format date (ISO 8601 to Indonesian format)
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch (_error) {
    return dateString;
  }
};

export default function NewsDisplay() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async (isPolling = false) => {
    // Only show loading on initial load, not during polling
    if (!isPolling) {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch(`/api/news?t=${Date.now()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.message || "Gagal mengambil berita.";
        setError(errorMessage);
        setNews([]);
        return;
      }

      const responseData = (await res.json()) as NewsResponse;

      if (!responseData.success) {
        setError(responseData.message || "Failed to fetch news.");
        setNews([]);
        return;
      }

      setNews(responseData.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Gagal mengambil berita";
      setError(errorMessage);
      setNews([]);
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void fetchNews(false);

    const intervalId = setInterval(() => {
      // News changes on the order of days; don't spend a backgrounded phone's
      // data and battery re-checking it every minute.
      if (document.visibilityState !== "visible") {
        return;
      }
      void fetchNews(true);
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return <ListSkeleton rows={2} trailing={false} />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (news.length === 0) {
    return (
      <EmptyState
        icon={Newspaper}
        title="Belum ada berita"
        description="Berita dan promo terbaru akan muncul di sini."
      />
    );
  }

  return (
    <div className="space-y-4">
      {news.map((item) => (
        <div key={item.id} className="tile">
          <h4 className="font-semibold">{item.title}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{item.content}</p>
          {item.createdAt && (
            <p className="text-xs text-muted-foreground mt-2">
              {formatDate(item.createdAt)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
