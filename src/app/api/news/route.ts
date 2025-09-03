import { NextResponse } from "next/server";

// PENTING: Ini adalah penyimpanan di memori. Data akan hilang saat server dimulai ulang.
// Ganti ini dengan database sungguhan di lingkungan produksi.
const newsData = [
  {
    "id": "news_1672531200000",
    "title": "Promo Spesial Tahun Baru!",
    "content": "Dapatkan diskon 50% untuk pendaftaran baru selama bulan Januari 2025.",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  {
    "id": "news_1672444800000",
    "title": "Peningkatan Kecepatan Gratis!",
    "content": "Nikmati peningkatan kecepatan gratis selama bulan Desember 2024.",
    "createdAt": "2024-12-31T00:00:00.000Z"
  }
];

export async function GET() {
  // Di aplikasi sungguhan, Anda akan mengambil data ini dari database
  // dan memastikan data diurutkan dari yang terbaru ke yang terlama.
  const sortedNews = newsData.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return NextResponse.json(sortedNews);
}
