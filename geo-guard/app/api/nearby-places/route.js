import { NextResponse } from "next/server";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const type = searchParams.get("type") || "restaurant"; // restaurant | lodging

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  if (!GOOGLE_MAPS_API_KEY) {
    // Return curated mock data when no API key
    return NextResponse.json({ places: getMockPlaces(type) });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1500&type=${type}&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return NextResponse.json({ places: getMockPlaces(type), note: data.status });
    }

    const places = (data.results || []).slice(0, 6).map((place) => ({
      id: place.place_id,
      name: place.name,
      rating: place.rating || null,
      totalRatings: place.user_ratings_total || 0,
      address: place.vicinity,
      open: place.opening_hours?.open_now ?? null,
      priceLevel: place.price_level ?? null,
      types: place.types || [],
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
    }));

    return NextResponse.json({ places });
  } catch (err) {
    return NextResponse.json({ places: getMockPlaces(type), error: err.message });
  }
}

function getMockPlaces(type) {
  if (type === "lodging") {
    return [
      { id: "m1", name: "The Grand Heritage Hotel", rating: 4.7, totalRatings: 1823, address: "12 Main Road", open: true, priceLevel: 3, types: ["lodging"] },
      { id: "m2", name: "Comfort Inn & Suites", rating: 4.2, totalRatings: 654, address: "Near City Center", open: true, priceLevel: 2, types: ["lodging"] },
      { id: "m3", name: "Tourist Rest House", rating: 4.0, totalRatings: 312, address: "Government Colony", open: true, priceLevel: 1, types: ["lodging"] },
    ];
  }
  return [
    { id: "m4", name: "Spice Garden Restaurant", rating: 4.5, totalRatings: 987, address: "Market Square", open: true, priceLevel: 2, types: ["restaurant"] },
    { id: "m5", name: "The Local Dhaba", rating: 4.3, totalRatings: 2341, address: "Highway 1", open: true, priceLevel: 1, types: ["restaurant"] },
    { id: "m6", name: "Café Sunrise", rating: 4.1, totalRatings: 456, address: "Tourist Zone", open: false, priceLevel: 1, types: ["cafe", "restaurant"] },
  ];
}
