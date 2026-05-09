import crypto from "node:crypto";

export function getIdPayload(tourist) {
  return {
    touristId: tourist.touristId,
    fullName: tourist.fullName,
    governmentId: tourist.governmentId,
    phone: tourist.phone,
    emergencyContact: tourist.emergencyContact,
    tripStartDate: tourist.tripStartDate,
    tripEndDate: tourist.tripEndDate,
    plannedItinerary: tourist.plannedItinerary,
  };
}

export function stableStringify(value) {
  return JSON.stringify(
    Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = value[key];
        return acc;
      }, {})
  );
}

export function generateHash(payload) {
  return crypto.createHash("sha256").update(stableStringify(payload)).digest("hex");
}

export function createTouristHash(tourist) {
  return generateHash(getIdPayload(tourist));
}

export function isIdValidForTrip(tourist, now = new Date()) {
  const start = new Date(tourist.tripStartDate);
  const end = new Date(tourist.tripEndDate);
  end.setHours(23, 59, 59, 999);
  return now >= start && now <= end;
}
