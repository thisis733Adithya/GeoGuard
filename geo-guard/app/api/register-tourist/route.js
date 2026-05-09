import { NextResponse } from "next/server";
import { createTourist } from "@/lib/store";

const requiredFields = [
  "fullName",
  "governmentId",
  "phone",
  "emergencyContact",
  "tripStartDate",
  "tripEndDate",
  "plannedItinerary",
];

export async function POST(request) {
  try {
    const body = await request.json();
    const missing = requiredFields.filter((field) => !body[field]);

    if (missing.length) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    if (new Date(body.tripEndDate) < new Date(body.tripStartDate)) {
      return NextResponse.json(
        { error: "Trip end date must be after trip start date." },
        { status: 400 }
      );
    }

    const tourist = await createTourist(body);
    return NextResponse.json({ tourist, touristId: tourist.touristId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
