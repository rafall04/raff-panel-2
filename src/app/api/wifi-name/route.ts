import { NextResponse } from "next/server";

export async function GET() {
  const wifiName = "RAF NET";
  return NextResponse.json({ wifiName });
}
