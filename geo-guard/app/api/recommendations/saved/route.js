import { NextResponse } from "next/server";
import { getSavedPlaces, toggleSavedPlace } from "@/lib/recommendations";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "guest";
  return NextResponse.json({ places: await getSavedPlaces(userId) });
}

export async function POST(request) {
  const body = await request.json();
  const result = await toggleSavedPlace({
    userId: body.userId || "guest",
    placeId: body.placeId,
    category: body.category || "saved",
    place: body.place || {},
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status || 400 });
  }
  return NextResponse.json(result);
}
