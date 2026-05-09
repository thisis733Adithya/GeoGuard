import { NextResponse } from "next/server";
import { findTourist, listTourists, updateTouristConsent } from "@/lib/store";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const touristId = searchParams.get("touristId");

    if (touristId) {
      const tourist = await findTourist(touristId);
      return NextResponse.json({ tourist });
    }

    const tourists = await listTourists();
    return NextResponse.json({ tourists });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    if (!body.touristId || body.trackingConsent === undefined) {
      return NextResponse.json(
        { error: "touristId and trackingConsent are required." },
        { status: 400 }
      );
    }

    const result = await updateTouristConsent(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: result.status || 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
