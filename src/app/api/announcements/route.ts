import { NextResponse } from "next/server";

// PENTING: Ini adalah penyimpanan di memori. Data akan hilang saat server dimulai ulang.
// Ganti ini dengan database sungguhan di lingkungan produksi.
const announcementsData = [
  {
    "id": "1672531200000",
    "message": "Selamat Tahun Baru 2025! Semoga di tahun yang baru ini kita semua diberikan kesehatan dan kesuksesan.",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  {
    "id": "1672444800000",
    "message": "Akan ada maintenance jaringan pada tanggal 31 Desember 2024 pukul 23:00.",
    "createdAt": "2024-12-31T00:00:00.000Z"
  }
];

export async function GET() {
  // Di aplikasi sungguhan, Anda akan mengambil data ini dari database
  // dan memastikan data diurutkan dari yang terbaru ke yang terlama.
  const sortedAnnouncements = announcementsData.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return NextResponse.json(sortedAnnouncements);
}
