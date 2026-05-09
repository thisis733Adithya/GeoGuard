import { NextResponse } from "next/server";
import { verifyTouristId } from "@/lib/store";

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.touristId) {
      return NextResponse.json({ error: "touristId is required." }, { status: 400 });
    }

    const result = await verifyTouristId(body.touristId);
    return NextResponse.json(result, { status: result.found ? 200 : 404 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
