import mongoose from "mongoose";

const RiskZoneSchema = new mongoose.Schema(
  {
    zoneId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    radiusMeters: { type: Number, required: true },
    severity: { type: String, enum: ["normal", "warning", "critical"], default: "warning" },
    advice: String,
  },
  { timestamps: true }
);

export default mongoose.models.RiskZone || mongoose.model("RiskZone", RiskZoneSchema);
