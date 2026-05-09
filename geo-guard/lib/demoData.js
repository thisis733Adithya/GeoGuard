export const defaultRiskZones = [
  {
    zoneId: "zone-red-fort",
    name: "Old Fort Restricted Perimeter",
    type: "restricted",
    latitude: 28.6562,
    longitude: 77.241,
    radiusMeters: 650,
    severity: "critical",
    advice: "Move toward the public gate and wait for patrol support.",
  },
  {
    zoneId: "zone-crowd-market",
    name: "Crowded Market High-Risk Zone",
    type: "high-risk",
    latitude: 28.6506,
    longitude: 77.2303,
    radiusMeters: 900,
    severity: "warning",
    advice: "Keep valuables secure and stay near marked tourist paths.",
  },
  {
    zoneId: "zone-river-edge",
    name: "River Edge Caution Area",
    type: "caution",
    latitude: 28.6129,
    longitude: 77.2295,
    radiusMeters: 700,
    severity: "warning",
    advice: "Avoid isolated riverbank paths after dark.",
  },
];

