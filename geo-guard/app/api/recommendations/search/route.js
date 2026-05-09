import { NextResponse } from "next/server";
import { checkRateLimit, geocodeSearch, getNearbyRecommendations } from "@/lib/recommendations";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || searchParams.get("query") || "";
  const userId = searchParams.get("userId") || "guest";

  if (!checkRateLimit(`search:${userId}`)) {
    return NextResponse.json({ error: "Too many searches. Please wait a moment and retry." }, { status: 429 });
  }

  try {
    const search = await geocodeSearch(query, userId);
    if (!search.ok) {
      return NextResponse.json({ error: search.error }, { status: search.status || 400 });
    }

    const nearby = await getNearbyRecommendations({
      latitude: search.location.coordinates.latitude,
      longitude: search.location.coordinates.longitude,
      type: "all",
      radius: Number(searchParams.get("radius") || 3500),
    });

    return NextResponse.json({
      location: search.location,
      places: nearby.places || [],
      source: search.source,
      generatedAt: nearby.generatedAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Search failed. Check your network or Google Places configuration.", detail: error.message },
      { status: 502 }
    );
  }
}
