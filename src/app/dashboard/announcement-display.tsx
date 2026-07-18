"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Megaphone } from "lucide-react";

interface Announcement {
  id: string;
  message: string;
  createdAt: string; // ISO 8601 date string
}

interface AnnouncementsResponse {
  success: boolean;
  data: Announcement[];
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

export default function AnnouncementDisplay() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = async (isPolling = false) => {
    // Only show loading on initial load, not during polling
    if (!isPolling) {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch(`/api/announcements?t=${Date.now()}`, {
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
        const errorMessage = errorData.message || "Gagal mengambil pengumuman.";
        setError(errorMessage);
        setAnnouncements([]);
        return;
      }

      const responseData = (await res.json()) as AnnouncementsResponse;

      if (!responseData.success) {
        setError(responseData.message || "Failed to fetch announcements.");
        setAnnouncements([]);
        return;
      }

      setAnnouncements(responseData.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Gagal mengambil pengumuman";
      setError(errorMessage);
      setAnnouncements([]);
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void fetchAnnouncements(false);

    const intervalId = setInterval(() => {
      // Same reasoning as news-display: not worth polling a hidden tab.
      if (document.visibilityState !== "visible") {
        return;
      }
      void fetchAnnouncements(true);
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Memuat pengumuman...
      </p>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Megaphone className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (announcements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {announcements.map((ann) => (
        <Alert key={ann.id}>
          <Megaphone className="h-4 w-4" />
          <AlertDescription className="space-y-1">
            <p>{ann.message}</p>
            {ann.createdAt && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(ann.createdAt)}
              </p>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
