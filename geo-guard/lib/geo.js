export function haversineDistanceMeters(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * earthRadius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function checkGeoFence(location, zones) {
  return zones
    .map((zone) => {
      const distanceMeters = haversineDistanceMeters(location, {
        latitude: zone.latitude,
        longitude: zone.longitude,
      });

      return {
        zone,
        distanceMeters,
        inside: distanceMeters <= zone.radiusMeters,
      };
    })
    .filter((entry) => entry.inside);
}

export function routeDeviationScore(tourist, location) {
  const text = (tourist.plannedItinerary || "").toLowerCase();
  const knownStops = [
    { keyword: "red fort", latitude: 28.6562, longitude: 77.241 },
    { keyword: "india gate", latitude: 28.6129, longitude: 77.2295 },
    { keyword: "museum", latitude: 28.6118, longitude: 77.2196 },
    { keyword: "connaught", latitude: 28.6315, longitude: 77.2167 },
    { keyword: "qutub", latitude: 28.5245, longitude: 77.1855 },
  ].filter((stop) => text.includes(stop.keyword));

  if (!knownStops.length) {
    return 0;
  }

  const nearestMeters = Math.min(
    ...knownStops.map((stop) =>
      haversineDistanceMeters(location, {
        latitude: stop.latitude,
        longitude: stop.longitude,
      })
    )
  );

  if (nearestMeters > 8000) return 35;
  if (nearestMeters > 4000) return 20;
  if (nearestMeters > 2000) return 10;
  return 0;
}
