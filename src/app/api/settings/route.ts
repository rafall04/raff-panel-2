import { NextResponse } from "next/server";

export async function GET() {
  // Di masa mendatang, Anda bisa mengganti bagian ini untuk mengambil data dari database Anda.
  // Contoh:
  // const settings = await database.query("SELECT company_name FROM settings LIMIT 1");
  // const companyName = settings[0].company_name;

  // Untuk saat ini, kita akan menggunakan nama yang di-hardcode.
  // Silakan ganti nilai ini sesuai dengan yang ada di backend Anda.
  const companyName = "RAF CYBER NET";

  return NextResponse.json({ companyName });
}
