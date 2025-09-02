"use client";

import { useEffect, useState } from "react";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function NewsDisplay() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch("/api/news");
        const data = await res.json();
        setNews(data);
      } catch (err) {
        console.error("Gagal mengambil berita:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Memuat berita...</p>;
  }

  if (news.length === 0) {
    return <p className="text-sm text-muted-foreground">Tidak ada berita atau promo saat ini.</p>;
  }

  return (
    <div className="space-y-4">
      {news.map((item) => (
        <div key={item.id} className="p-4 border rounded-lg bg-card">
            <h4 className="font-semibold">{item.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{item.content}</p>
        </div>
      ))}
    </div>
  );
}
