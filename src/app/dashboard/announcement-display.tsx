"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Megaphone } from "lucide-react";

interface Announcement {
  id: string;
  message: string;
  createdAt: string;
}

export default function AnnouncementDisplay() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch("/api/announcements");
        const data = await res.json();
        setAnnouncements(data);
      } catch (err) {
        console.error("Gagal mengambil pengumuman:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  if (loading) {
    return <p className="text-center text-sm text-muted-foreground">Memuat pengumuman...</p>;
  }

  if (announcements.length === 0) {
    return null; // Jangan render apapun jika tidak ada pengumuman
  }

  return (
    <div className="space-y-2">
      {announcements.map((ann) => (
        <Alert key={ann.id}>
          <Megaphone className="h-4 w-4" />
          <AlertDescription>{ann.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
