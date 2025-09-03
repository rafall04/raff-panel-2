import { NextResponse } from "next/server";

export async function GET() {
  if (!process.env.API_URL) {
    return NextResponse.json(
      { message: "Server configuration error: API_URL is not set." },
      { status: 500 }
    );
  }

  try {
    const backendResponse = await fetch(`${process.env.API_URL}/api/news`, {
      next: { revalidate: 60 } // Cache for 1 minute
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(
        { message: "Failed to fetch news from backend.", details: errorData },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { message: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
