import { NextResponse } from "next/server";

// PENTING: Ini adalah penyimpanan di memori. Data akan hilang saat server dimulai ulang.
// Ganti ini dengan database sungguhan di lingkungan produksi.
const announcements: { id: string; message: string; createdAt: Date }[] = [
    {
        id: "1",
        message: "Selamat datang di portal WiFi kami! Nikmati koneksi yang stabil dan cepat.",
        createdAt: new Date()
    }
];

export async function GET() {
  // Di aplikasi sungguhan, Anda akan mengambil data ini dari database
  return NextResponse.json(announcements);
}
