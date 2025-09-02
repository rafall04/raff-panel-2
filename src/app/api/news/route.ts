import { NextResponse } from "next/server";

// PENTING: Ini adalah penyimpanan di memori. Data akan hilang saat server dimulai ulang.
// Ganti ini dengan database sungguhan di lingkungan produksi.
const newsItems: { id: string; title: string; content: string; createdAt: Date }[] = [
    {
        id: "1",
        title: "Promo Spesial Bulan Ini!",
        content: "Dapatkan diskon 20% untuk perpanjangan paket internet Anda bulan ini. Hubungi kami untuk info lebih lanjut.",
        createdAt: new Date()
    }
];

export async function GET() {
  // Di aplikasi sungguhan, Anda akan mengambil data ini dari database
  return NextResponse.json(newsItems);
}
