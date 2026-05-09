import { connectMongo, hasMongoUri } from "./mongodb";
import { defaultRiskZones } from "./demoData";
import { createTouristHash, isIdValidForTrip } from "./hash";
import { checkGeoFence, haversineDistanceMeters } from "./geo";
import { detectSafetyAnomaly } from "./anomaly";
import Tourist from "@/models/Tourist";
import Alert from "@/models/Alert";
import RiskZone from "@/models/RiskZone";
import LocationUpdate from "@/models/LocationUpdate";

function serialize(value) {
  return JSON.parse(JSON.stringify(value));
}

function getMemory() {
  if (!global.geoGuardMemory) {
    global.geoGuardMemory = {
      tourists: [],
      alerts: [],
      riskZones: defaultRiskZones,
      locations: [],
    };
  }

  return global.geoGuardMemory;
}

export function generateTouristId() {
  const part = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `TID-${new Date().getFullYear()}-${part}`;
}

export async function ensureRiskZones() {
  if (!hasMongoUri()) {
    return getMemory().riskZones;
  }

  await connectMongo();
  const count = await RiskZone.countDocuments();
  if (count === 0) {
    await RiskZone.insertMany(defaultRiskZones);
  }
  return serialize(await RiskZone.find().sort({ severity: 1, name: 1 }));
}

export async function createTourist(input) {
  const tourist = {
    touristId: generateTouristId(),
    fullName: input.fullName,
    governmentId: input.governmentId,
    phone: input.phone,
    emergencyContact: input.emergencyContact,
    tripStartDate: input.tripStartDate,
    tripEndDate: input.tripEndDate,
    plannedItinerary: input.plannedItinerary,
    trackingConsent: Boolean(input.trackingConsent),
    safetyScore: 85,
    status: "active",
  };
  tourist.idHash = createTouristHash(tourist);

  if (!hasMongoUri()) {
    const stored = {
      ...tourist,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    getMemory().tourists.unshift(stored);
    return stored;
  }

  await connectMongo();
  return serialize(await Tourist.create(tourist));
}

export async function listTourists() {
  if (!hasMongoUri()) {
    return getMemory().tourists;
  }

  await connectMongo();
  return serialize(await Tourist.find().sort({ createdAt: -1 }));
}

export async function findTourist(touristId) {
  if (!hasMongoUri()) {
    return getMemory().tourists.find((tourist) => tourist.touristId === touristId) || null;
  }

  await connectMongo();
  return serialize(await Tourist.findOne({ touristId }));
}

export async function updateTouristConsent({ touristId, trackingConsent }) {
  const tourist = await findTourist(touristId);
  if (!tourist) {
    return { ok: false, status: 404, message: "Tourist not found." };
  }

  if (!hasMongoUri()) {
    const memory = getMemory();
    const index = memory.tourists.findIndex((row) => row.touristId === touristId);
    memory.tourists[index] = {
      ...memory.tourists[index],
      trackingConsent: Boolean(trackingConsent),
      updatedAt: new Date().toISOString(),
    };
    return { ok: true, tourist: memory.tourists[index] };
  }

  await connectMongo();
  const updated = await Tourist.findOneAndUpdate(
    { touristId },
    { $set: { trackingConsent: Boolean(trackingConsent) } },
    { new: true }
  );
  return { ok: true, tourist: serialize(updated) };
}

export async function listAlerts() {
  if (!hasMongoUri()) {
    return getMemory().alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  await connectMongo();
  return serialize(await Alert.find().sort({ createdAt: -1 }).limit(100));
}

export async function createAlert(alert) {
  const payload = {
    ...alert,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!hasMongoUri()) {
    const stored = { id: `ALT-${Date.now()}`, ...payload };
    getMemory().alerts.unshift(stored);
    return stored;
  }

  await connectMongo();
  return serialize(await Alert.create(alert));
}

export async function listRecentLocations(touristId, limit = 8) {
  if (!hasMongoUri()) {
    return getMemory()
      .locations.filter((location) => location.touristId === touristId)
      .slice(-limit);
  }

  await connectMongo();
  const rows = await LocationUpdate.find({ touristId }).sort({ createdAt: -1 }).limit(limit);
  return serialize(rows.reverse());
}

export async function updateTouristLocation({ touristId, latitude, longitude, source = "browser" }) {
  const tourist = await findTourist(touristId);
  if (!tourist) {
    return { ok: false, status: 404, message: "Tourist not found." };
  }

  if (!tourist.trackingConsent) {
    return { ok: false, status: 403, message: "Tracking consent is disabled for this tourist." };
  }

  const now = new Date();
  const location = {
    latitude: Number(latitude),
    longitude: Number(longitude),
    timestamp: now.toISOString(),
  };

  const zones = await ensureRiskZones();
  const recentBefore = await listRecentLocations(touristId, 8);
  const anomaly = detectSafetyAnomaly({
    tourist,
    location,
    recentUpdates: [...recentBefore, location],
    lastUpdateAt: tourist.lastKnownLocation?.timestamp || tourist.updatedAt,
  });
  const matches = checkGeoFence(location, zones);
  const scorePenalty = matches.some((match) => match.zone.severity === "critical") ? 35 : matches.length ? 18 : 0;
  const safetyScore = Math.max(0, 100 - anomaly.riskScore - scorePenalty);
  const status = safetyScore < 35 ? "critical" : safetyScore < 65 ? "watch" : "active";

  if (!hasMongoUri()) {
    const memory = getMemory();
    const index = memory.tourists.findIndex((row) => row.touristId === touristId);
    memory.tourists[index] = {
      ...memory.tourists[index],
      lastKnownLocation: location,
      safetyScore,
      status,
      updatedAt: now.toISOString(),
    };
    memory.locations.push({
      touristId,
      latitude: location.latitude,
      longitude: location.longitude,
      source,
      riskScore: anomaly.riskScore,
      anomalyType: anomaly.anomalyType,
      createdAt: now.toISOString(),
    });
  } else {
    await connectMongo();
    await LocationUpdate.create({
      touristId,
      latitude: location.latitude,
      longitude: location.longitude,
      source,
      riskScore: anomaly.riskScore,
      anomalyType: anomaly.anomalyType,
    });
    await Tourist.updateOne(
      { touristId },
      {
        $set: {
          lastKnownLocation: location,
          safetyScore,
          status,
        },
      }
    );
  }

  const createdAlerts = [];
  for (const match of matches) {
    createdAlerts.push(
      await createAlert({
        touristId,
        touristName: tourist.fullName,
        type: "geo-fence",
        severity: match.zone.severity,
        message: `${tourist.fullName} entered ${match.zone.name}.`,
        suggestion: match.zone.advice,
        location,
        zoneId: match.zone.zoneId,
      })
    );
  }

  if (anomaly.riskScore >= 65) {
    createdAlerts.push(
      await createAlert({
        touristId,
        touristName: tourist.fullName,
        type: "anomaly",
        severity: anomaly.riskScore >= 80 ? "critical" : "warning",
        message: `${anomaly.anomalyType} detected for ${tourist.fullName}.`,
        suggestion: anomaly.suggestion,
        location,
      })
    );
  }

  return {
    ok: true,
    location,
    safetyScore,
    status,
    anomaly,
    geoFenceMatches: matches,
    alerts: createdAlerts,
  };
}

export async function createPanicAlert({ touristId, latitude, longitude }) {
  const tourist = await findTourist(touristId);
  if (!tourist) {
    return { ok: false, status: 404, message: "Tourist not found." };
  }

  const location = {
    latitude: Number(latitude || tourist.lastKnownLocation?.latitude || 28.6139),
    longitude: Number(longitude || tourist.lastKnownLocation?.longitude || 77.209),
  };
  const incidentCode = `SOS-${Date.now().toString(36).toUpperCase()}`;
  const nearestEmergency = getNearestEmergencyUnit(location);

  let placeName = `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=14&addressdetails=1`, {
      headers: { "User-Agent": "GeoGuard/1.0" }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        placeName = data.address.suburb || data.address.neighbourhood || data.address.city_district || data.address.city || data.address.town || data.display_name.split(',')[0];
      }
    }
  } catch (e) {
    // Fallback to coordinates if reverse geocoding fails
  }

  const alert = await createAlert({
    touristId,
    touristName: tourist.fullName,
    type: "sos",
    severity: "critical",
    message: `${tourist.fullName} triggered panic SOS ${incidentCode} near ${placeName}. Coordinates: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`,
    suggestion: `Dispatch ${nearestEmergency.name}, call ${tourist.emergencyContact}, and keep tourist on line.`,
    location,
  });

  if (!hasMongoUri()) {
    const memory = getMemory();
    const index = memory.tourists.findIndex((row) => row.touristId === touristId);
    if (index >= 0) {
      memory.tourists[index] = {
        ...memory.tourists[index],
        safetyScore: 5,
        status: "critical",
        lastKnownLocation: { ...location, timestamp: new Date().toISOString() },
      };
    }
  } else {
    await connectMongo();
    await Tourist.updateOne(
      { touristId },
      {
        $set: {
          safetyScore: 5,
          status: "critical",
          lastKnownLocation: { ...location, timestamp: new Date() },
        },
      }
    );
  }

  return {
    ok: true,
    incidentCode,
    alert,
    nearestEmergency,
  };
}

function getNearestEmergencyUnit(location) {
  const units = [
    {
      name: "Red Fort Police Booth",
      area: "Old Delhi heritage corridor",
      latitude: 28.6556,
      longitude: 77.2405,
      phone: "112",
    },
    {
      name: "India Gate Tourist Police Van",
      area: "India Gate lawns",
      latitude: 28.6129,
      longitude: 77.2295,
      phone: "112",
    },
    {
      name: "Connaught Place Response Desk",
      area: "Connaught Place inner circle",
      latitude: 28.6315,
      longitude: 77.2167,
      phone: "112",
    },
    {
      name: "Market Patrol Unit",
      area: "crowded market zone",
      latitude: 28.6506,
      longitude: 77.2303,
      phone: "112",
    },
  ];

  const [nearest] = units
    .map((unit) => ({
      ...unit,
      meters: haversineDistanceMeters(location, {
        latitude: unit.latitude,
        longitude: unit.longitude,
      }),
    }))
    .sort((a, b) => a.meters - b.meters);

  const kilometers = nearest.meters / 1000;
  
  if (kilometers > 50) {
    return {
      name: "Local Emergency Services",
      area: "your location",
      eta: "Unknown",
      phone: "112",
      distance: `${kilometers.toFixed(1)} km`,
    };
  }

  const etaMinutes = Math.max(3, Math.round(kilometers * 5 + 2));

  return {
    name: nearest.name,
    area: nearest.area,
    eta: `${etaMinutes} min`,
    phone: nearest.phone,
    distance: `${kilometers.toFixed(1)} km`,
  };
}

export async function verifyTouristId(touristId) {
  const tourist = await findTourist(touristId);
  if (!tourist) {
    return { found: false, verified: false, message: "Tourist ID not found." };
  }

  const currentHash = createTouristHash(tourist);
  const verified = currentHash === tourist.idHash;
  return {
    found: true,
    verified,
    validForTrip: isIdValidForTrip(tourist),
    storedHash: tourist.idHash,
    computedHash: currentHash,
    tourist,
    message: verified ? "Digital ID integrity verified." : "Digital ID data has changed.",
  };
}
