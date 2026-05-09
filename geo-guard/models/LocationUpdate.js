import mongoose from "mongoose";

const LocationUpdateSchema = new mongoose.Schema(
  {
    touristId: { type: String, required: true, index: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    source: { type: String, default: "browser" },
    riskScore: { type: Number, default: 10 },
    anomalyType: { type: String, default: "normal" },
  },
  { timestamps: true }
);

export default mongoose.models.LocationUpdate ||
  mongoose.model("LocationUpdate", LocationUpdateSchema);
