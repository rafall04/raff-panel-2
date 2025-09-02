import { NextResponse } from "next/server";

// PENTING: Ini adalah penyimpanan di memori. Data akan hilang saat server dimulai ulang.
// Ganti ini dengan database sungguhan di lingkungan produksi.
let newsItems: { id: string; title: string; content: string; createdAt: Date }[] = [
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

export async function POST(request: Request) {
  try {
    const { title, content } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Judul dan konten tidak boleh kosong" },
        { status: 400 }
      );
    }

    const newNewsItem = {
      id: (newsItems.length + 1).toString(),
      title,
      content,
      createdAt: new Date(),
    };

    // Di aplikasi sungguhan, Anda akan menyimpan ini ke database
    newsItems.push(newNewsItem);

    return NextResponse.json(newNewsItem, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
