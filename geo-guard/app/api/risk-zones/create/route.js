import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import RiskZone from "@/models/RiskZone";

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.latitude || !body.longitude) {
      return NextResponse.json({ error: "Latitude and longitude required" }, { status: 400 });
    }

    await connectMongo();

    const newZone = await RiskZone.create({
      zoneId: `zone-test-${Date.now()}`,
      name: "Dynamic Test Risk Zone",
      type: "high-risk",
      latitude: body.latitude,
      longitude: body.longitude,
      radiusMeters: 500,
      severity: "critical",
      advice: "You have entered a dynamically generated test zone.",
    });

    return NextResponse.json({ ok: true, zone: newZone }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
