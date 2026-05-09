import { NextResponse } from "next/server";
import { updateTouristLocation } from "@/lib/store";

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.touristId || body.latitude === undefined || body.longitude === undefined) {
      return NextResponse.json(
        { error: "touristId, latitude, and longitude are required." },
        { status: 400 }
      );
    }

    const result = await updateTouristLocation(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: result.status || 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
