import { NextResponse } from "next/server";
import { listAlerts } from "@/lib/store";

export async function GET() {
  try {
    const alerts = await listAlerts();
    return NextResponse.json({ alerts });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
