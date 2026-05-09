import { NextResponse } from "next/server";
import { getNearbyRecommendations } from "@/lib/recommendations";

export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url);
  const { type } = await params;

  try {
    const result = await getNearbyRecommendations({
      latitude: searchParams.get("lat"),
      longitude: searchParams.get("lng"),
      type,
      radius: Number(searchParams.get("radius") || 3500),
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: `Unable to load ${type} recommendations.`, detail: error.message },
      { status: 502 }
    );
  }
}
