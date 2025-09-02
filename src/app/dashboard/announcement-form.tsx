"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnnouncementForm() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Pengumuman tidak boleh kosong.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Memublikasikan pengumuman...");
    try {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengirim pengumuman");
      }

      toast.success("Pengumuman berhasil dipublikasikan!", { id: toastId });
      setMessage("");
      // Cara sederhana untuk me-refresh data adalah dengan memuat ulang halaman.
      // Di aplikasi yang lebih kompleks, Anda mungkin ingin menggunakan manajemen state global.
      window.location.reload();
    } catch (error) {
      toast.error((error as Error).message || "Terjadi kesalahan.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
        <CardHeader>
            <CardTitle>Admin: Buat Pengumuman</CardTitle>
            <CardDescription>Pengumuman ini akan ditampilkan di bagian atas dasbor untuk semua pengguna.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
                placeholder="Ketik pengumuman Anda di sini..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
            />
            <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Memublikasikan..." : "Publikasikan Pengumuman"}
            </Button>
            </form>
        </CardContent>
    </>
  );
}
