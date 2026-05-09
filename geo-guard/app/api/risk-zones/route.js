import { NextResponse } from "next/server";
import { ensureRiskZones } from "@/lib/store";

export async function GET() {
  try {
    const zones = await ensureRiskZones();
    return NextResponse.json({ zones });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
