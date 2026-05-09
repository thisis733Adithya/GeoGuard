import { NextResponse } from "next/server";
import { createPanicAlert } from "@/lib/store";

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.touristId) {
      return NextResponse.json({ error: "touristId is required." }, { status: 400 });
    }

    const result = await createPanicAlert(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: result.status || 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
