import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  if (!process.env.API_URL) {
    return NextResponse.json({ error: "API_URL not set" }, { status: 500 });
  }

  try {
    const response = await fetch(`${process.env.API_URL}/api/auth/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: "test", otp: "test" }),
    });

    const text = await response.text();

    return NextResponse.json({
      success: true,
      backendStatus: response.status,
      backendResponse: text.substring(0, 500),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
