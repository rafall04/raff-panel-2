"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


export default function NewsForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Judul dan konten tidak boleh kosong.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Memublikasikan berita/promo...");
    try {
      const response = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengirim berita/promo");
      }

      toast.success("Berita/promo berhasil dipublikasikan!", { id: toastId });
      setTitle("");
      setContent("");
      window.location.reload();
    } catch (error) {
      toast.error((error as Error).message || "Terjadi kesalahan.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-6 bg-background/50">
        <CardHeader>
            <CardTitle className="text-base">Admin: Buat Berita/Promo</CardTitle>
            <CardDescription>Buat berita atau promo baru untuk ditampilkan kepada pengguna.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    placeholder="Judul berita atau promo"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={loading}
                />
                <Textarea
                    placeholder="Isi konten berita atau promo..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={loading}
                />
                <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Memublikasikan..." : "Publikasikan"}
                </Button>
            </form>
        </CardContent>
    </Card>
  );
}
