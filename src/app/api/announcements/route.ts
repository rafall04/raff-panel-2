import { NextResponse } from "next/server";

// PENTING: Ini adalah penyimpanan di memori. Data akan hilang saat server dimulai ulang.
// Ganti ini dengan database sungguhan di lingkungan produksi.
let announcements: { id: string; message: string; createdAt: Date }[] = [
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

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong" },
        { status: 400 }
      );
    }

    const newAnnouncement = {
      id: (announcements.length + 1).toString(),
      message,
      createdAt: new Date(),
    };

    // Di aplikasi sungguhan, Anda akan menyimpan ini ke database
    announcements.push(newAnnouncement);

    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
