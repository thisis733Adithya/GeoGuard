import { haversineDistanceMeters } from "@/lib/geo";
import { connectMongo, hasMongoUri } from "@/lib/mongodb";
import { ensureRiskZones } from "@/lib/store";
import RecommendationSearchHistory from "@/models/RecommendationSearchHistory";
import SavedPlace from "@/models/SavedPlace";

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const CACHE_TTL_MS = 1000 * 60 * 10;
const RATE_LIMIT_WINDOW_MS = 1000 * 60;
const RATE_LIMIT_MAX = 60;

const CATEGORY_CONFIG = {
  accommodation: {
    label: "Accommodation",
    placeTypes: ["lodging"],
    keywords: ["hotel", "resort", "lodge", "homestay"],
  },
  hotels: {
    label: "Hotels",
    placeTypes: ["lodging"],
    keywords: ["hotel"],
  },
  food: {
    label: "Food",
    placeTypes: ["restaurant", "cafe", "meal_takeaway"],
    keywords: ["restaurant", "cafe", "fast food", "local food"],
  },
  emergency: {
    label: "Emergency Services",
    placeTypes: ["hospital", "police", "pharmacy"],
    keywords: ["hospital", "police station", "pharmacy"],
  },
};

const memory = global.geoGuardRecommendations || {
  cache: new Map(),
  history: [],
  savedPlaces: [],
  rateLimit: new Map(),
};
global.geoGuardRecommendations = memory;

export function getCategoryConfig(type = "food") {
  return CATEGORY_CONFIG[type] || CATEGORY_CONFIG.food;
}

export function validateCoordinates(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return null;
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

export function checkRateLimit(key = "anonymous") {
  const now = Date.now();
  const bucket = memory.rateLimit.get(key) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  bucket.count += 1;
  memory.rateLimit.set(key, bucket);
  return bucket.count <= RATE_LIMIT_MAX;
}

export async function geocodeSearch(query, userId = "guest") {
  const searchQuery = String(query || "").trim();
  if (searchQuery.length < 2) {
    return { ok: false, status: 400, error: "Enter a place name to search." };
  }

  const cacheKey = `geocode:${searchQuery.toLowerCase()}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  if (!GOOGLE_API_KEY) {
    const fallback = getFallbackLocation(searchQuery);
    await saveSearchHistory({ userId, searchQuery, coordinates: fallback.coordinates });
    return setCache(cacheKey, { ok: true, ...fallback, source: "demo" });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", searchQuery);
  url.searchParams.set("key", GOOGLE_API_KEY);
  url.searchParams.set("region", "in");

  const response = await fetch(url);
  const data = await response.json();
  if (data.status !== "OK" || !data.results?.length) {
    return { ok: false, status: 404, error: "We could not find that location. Try a nearby landmark or city." };
  }

  const result = data.results[0];
  const coordinates = {
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
  };
  await saveSearchHistory({ userId, searchQuery, coordinates });

  return setCache(cacheKey, {
    ok: true,
    location: {
      name: result.formatted_address,
      placeId: result.place_id,
      coordinates,
    },
    source: "google",
  });
}

export async function getNearbyRecommendations({ latitude, longitude, type = "all", radius = 3000 }) {
  const coords = validateCoordinates(latitude, longitude);
  if (!coords) {
    return { ok: false, status: 400, error: "Valid latitude and longitude are required." };
  }

  const cacheKey = `nearby:${coords.latitude.toFixed(4)}:${coords.longitude.toFixed(4)}:${type}:${radius}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const categories = type === "all" ? Object.keys(CATEGORY_CONFIG) : [type];
  const [zones, rawPlaces] = await Promise.all([
    ensureRiskZones(),
    GOOGLE_API_KEY ? fetchGooglePlaces({ ...coords, categories, radius }) : Promise.resolve(getMockPlaces(coords)),
  ]);

  const places = rawPlaces
    .map((place) => enrichPlace(place, coords, zones))
    .sort((a, b) => b.safetyScore - a.safetyScore || a.distanceMeters - b.distanceMeters)
    .slice(0, 36);

  return setCache(cacheKey, {
    ok: true,
    center: coords,
    places,
    categories: CATEGORY_CONFIG,
    generatedAt: new Date().toISOString(),
    source: GOOGLE_API_KEY ? "google" : "demo",
  });
}

export async function getSavedPlaces(userId = "guest") {
  if (!hasMongoUri()) {
    return memory.savedPlaces.filter((row) => row.userId === userId);
  }

  await connectMongo();
  return JSON.parse(JSON.stringify(await SavedPlace.find({ userId }).sort({ savedAt: -1 })));
}

export async function toggleSavedPlace({ userId = "guest", placeId, category, place }) {
  if (!placeId) return { ok: false, status: 400, error: "placeId is required." };

  if (!hasMongoUri()) {
    const index = memory.savedPlaces.findIndex((row) => row.userId === userId && row.placeId === placeId);
    if (index >= 0) {
      memory.savedPlaces.splice(index, 1);
      return { ok: true, saved: false };
    }
    const saved = { userId, placeId, category, place, savedAt: new Date().toISOString() };
    memory.savedPlaces.unshift(saved);
    return { ok: true, saved: true, place: saved };
  }

  await connectMongo();
  const existing = await SavedPlace.findOne({ userId, placeId });
  if (existing) {
    await existing.deleteOne();
    return { ok: true, saved: false };
  }
  const saved = await SavedPlace.create({ userId, placeId, category, place });
  return { ok: true, saved: true, place: JSON.parse(JSON.stringify(saved)) };
}

async function fetchGooglePlaces({ latitude, longitude, categories, radius }) {
  const requests = [];
  for (const category of categories) {
    const config = getCategoryConfig(category);
    for (const placeType of config.placeTypes) {
      const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
      url.searchParams.set("location", `${latitude},${longitude}`);
      url.searchParams.set("radius", String(radius));
      url.searchParams.set("type", placeType);
      url.searchParams.set("key", GOOGLE_API_KEY);
      requests.push(fetch(url).then((res) => res.json()).then((data) => ({ data, category })));
    }
  }

  const responses = await Promise.allSettled(requests);
  const byId = new Map();
  for (const response of responses) {
    if (response.status !== "fulfilled") continue;
    const { data, category } = response.value;
    for (const place of data.results || []) {
      if (!byId.has(place.place_id)) byId.set(place.place_id, normalizeGooglePlace(place, category));
    }
  }
  return [...byId.values()];
}

function normalizeGooglePlace(place, category) {
  return {
    id: place.place_id,
    placeId: place.place_id,
    name: place.name,
    category,
    address: place.vicinity || place.formatted_address || "Address unavailable",
    latitude: place.geometry?.location?.lat,
    longitude: place.geometry?.location?.lng,
    rating: place.rating || 0,
    totalRatings: place.user_ratings_total || 0,
    openNow: place.opening_hours?.open_now ?? null,
    priceLevel: place.price_level ?? null,
    photoRef: place.photos?.[0]?.photo_reference || null,
    types: place.types || [],
    phone: null,
  };
}

function enrichPlace(place, origin, zones) {
  const distanceMeters = haversineDistanceMeters(origin, {
    latitude: place.latitude,
    longitude: place.longitude,
  });
  const nearestRisk = zones
    .map((zone) => ({
      ...zone,
      distanceMeters: haversineDistanceMeters(
        { latitude: place.latitude, longitude: place.longitude },
        { latitude: zone.latitude, longitude: zone.longitude }
      ),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters)[0];
  const dangerBuffer = nearestRisk ? Number(nearestRisk.radiusMeters || 0) + 250 : 0;
  const nearUnsafeZone = nearestRisk ? nearestRisk.distanceMeters <= dangerBuffer : false;
  const riskLevel = nearUnsafeZone
    ? nearestRisk.severity === "critical" ? "high" : "medium"
    : "low";
  const safetyScore = Math.max(10, Math.round((place.rating || 3.8) * 18 + (nearUnsafeZone ? -35 : 12)));

  return {
    ...place,
    distanceMeters: Math.round(distanceMeters),
    distanceText: formatDistance(distanceMeters),
    safetyScore,
    verifiedSafe: !nearUnsafeZone && (place.rating || 0) >= 4,
    riskLevel,
    riskMessage: nearUnsafeZone
      ? `Near ${nearestRisk.name}. ${nearestRisk.advice || "Use caution around this area."}`
      : "Outside active Geo Guard risk zones",
  };
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

async function saveSearchHistory({ userId, searchQuery, coordinates }) {
  if (!hasMongoUri()) {
    memory.history.unshift({ userId, searchQuery, coordinates, timestamp: new Date().toISOString() });
    memory.history = memory.history.slice(0, 25);
    return;
  }
  await connectMongo();
  await RecommendationSearchHistory.create({ userId, searchQuery, coordinates });
}

function getCache(key) {
  const row = memory.cache.get(key);
  if (!row || row.expiresAt < Date.now()) return null;
  return row.value;
}

function setCache(key, value) {
  memory.cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

function getFallbackLocation(query) {
  const lower = query.toLowerCase();
  const known = [
    ["mysore", "Mysore Palace, Karnataka", 12.3052, 76.6552],
    ["bengaluru", "Bengaluru, Karnataka", 12.9716, 77.5946],
    ["bangalore", "Bengaluru, Karnataka", 12.9716, 77.5946],
    ["goa", "Baga Beach, Goa", 15.5553, 73.7517],
    ["coorg", "Madikeri, Coorg, Karnataka", 12.4244, 75.7382],
  ].find(([needle]) => lower.includes(needle));
  const [, name, latitude, longitude] = known || ["", "India Gate, New Delhi", 28.6129, 77.2295];
  return { location: { name, placeId: `demo-${name}`, coordinates: { latitude, longitude } } };
}

function getMockPlaces(origin) {
  return [
    mock("demo-hotel-1", "The Grand Heritage Hotel", "accommodation", "Palace Road", 4.7, 1342, true, 0.012, 0.008),
    mock("demo-resort-1", "Verdant Stay Resort", "accommodation", "Hill View Road", 4.5, 921, true, -0.014, 0.01),
    mock("demo-food-1", "Spice Garden Restaurant", "food", "Market Square", 4.6, 2110, true, 0.006, -0.009),
    mock("demo-cafe-1", "Local Roast Cafe", "food", "Museum Lane", 4.3, 686, false, -0.008, -0.006),
    mock("demo-hospital-1", "City Care Hospital", "emergency", "Central Avenue", 4.1, 340, true, 0.018, -0.004),
    mock("demo-police-1", "Tourist Police Station", "emergency", "Station Road", 4.0, 178, true, -0.015, -0.012),
    mock("demo-pharmacy-1", "24x7 SafeMed Pharmacy", "emergency", "Main Junction", 4.4, 254, true, 0.004, 0.016),
  ].map((place) => ({
    ...place,
    latitude: origin.latitude + place.latOffset,
    longitude: origin.longitude + place.lngOffset,
  }));
}

function mock(id, name, category, address, rating, totalRatings, openNow, latOffset, lngOffset) {
  return {
    id,
    placeId: id,
    name,
    category,
    address,
    rating,
    totalRatings,
    openNow,
    priceLevel: category === "emergency" ? null : 2,
    photoRef: null,
    types: [category],
    phone: category === "emergency" ? "112" : null,
    latOffset,
    lngOffset,
  };
}
