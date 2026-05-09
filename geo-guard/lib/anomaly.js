import { haversineDistanceMeters, routeDeviationScore } from "./geo";

export function detectSafetyAnomaly({ tourist, location, recentUpdates = [], lastUpdateAt }) {
  let riskScore = 10;
  const types = [];
  const suggestions = [];

  if (!tourist.trackingConsent) {
    return {
      riskScore: 0,
      anomalyType: "tracking-disabled",
      suggestion: "Tracking consent is off. Ask tourist to enable it during the trip.",
    };
  }

  const now = new Date();
  const lastSeen = lastUpdateAt ? new Date(lastUpdateAt) : null;
  const minutesSinceLastUpdate = lastSeen ? (now - lastSeen) / 60000 : 0;

  if (minutesSinceLastUpdate > 30) {
    riskScore += 35;
    types.push("missing-signal");
    suggestions.push("Call tourist and emergency contact.");
  } else if (minutesSinceLastUpdate > 15) {
    riskScore += 20;
    types.push("sudden-update-drop");
    suggestions.push("Ask tourist to refresh location.");
  }

  if (recentUpdates.length >= 3) {
    const first = recentUpdates[0];
    const latest = recentUpdates[recentUpdates.length - 1];
    const movedMeters = haversineDistanceMeters(first, latest);
    const spanMinutes = (new Date(latest.timestamp || latest.createdAt) - new Date(first.timestamp || first.createdAt)) / 60000;

    if (spanMinutes >= 20 && movedMeters < 30) {
      riskScore += 25;
      types.push("no-movement");
      suggestions.push("Check for medical or device trouble.");
    }
  }

  const deviation = routeDeviationScore(tourist, location);
  if (deviation >= 20) {
    riskScore += deviation;
    types.push("route-deviation");
    suggestions.push("Guide tourist back to planned route.");
  }

  if ((tourist.plannedItinerary || "").toLowerCase().includes("solo")) {
    riskScore += 10;
    types.push("solo-travel-watch");
  }

  return {
    riskScore: Math.min(100, riskScore),
    anomalyType: types.length ? types.join(", ") : "normal",
    suggestion: suggestions[0] || "Continue passive monitoring.",
  };
}
