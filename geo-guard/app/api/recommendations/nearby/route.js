import { NextResponse } from "next/server";
import { checkRateLimit, getNearbyRecommendations } from "@/lib/recommendations";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "guest";

  if (!checkRateLimit(`nearby:${userId}`)) {
    return NextResponse.json({ error: "Too many nearby requests. Please wait a moment and retry." }, { status: 429 });
  }

  try {
    const result = await getNearbyRecommendations({
      latitude: searchParams.get("lat"),
      longitude: searchParams.get("lng"),
      type: searchParams.get("type") || "all",
      radius: Number(searchParams.get("radius") || 3500),
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load nearby recommendations.", detail: error.message },
      { status: 502 }
    );
  }
}
