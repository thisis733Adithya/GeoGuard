import { NextResponse } from "next/server";

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const photoRef = searchParams.get("ref");

  if (!photoRef || !GOOGLE_API_KEY) {
    return NextResponse.redirect(new URL("/logo.png", request.url));
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/photo");
  url.searchParams.set("maxwidth", searchParams.get("w") || "640");
  url.searchParams.set("photo_reference", photoRef);
  url.searchParams.set("key", GOOGLE_API_KEY);

  try {
    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) throw new Error("Photo unavailable");
    const bytes = await response.arrayBuffer();
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": response.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.redirect(new URL("/logo.png", request.url));
  }
}
