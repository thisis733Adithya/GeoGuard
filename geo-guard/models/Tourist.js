import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema(
  {
    latitude: Number,
    longitude: Number,
    timestamp: Date,
  },
  { _id: false }
);

const TouristSchema = new mongoose.Schema(
  {
    touristId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true },
    governmentId: { type: String, required: true },
    phone: { type: String, required: true },
    emergencyContact: { type: String, required: true },
    tripStartDate: { type: String, required: true },
    tripEndDate: { type: String, required: true },
    plannedItinerary: { type: String, required: true },
    trackingConsent: { type: Boolean, default: false },
    safetyScore: { type: Number, default: 85 },
    status: { type: String, enum: ["active", "expired", "watch", "critical"], default: "active" },
    idHash: { type: String, required: true },
    lastKnownLocation: LocationSchema,
  },
  { timestamps: true }
);

export default mongoose.models.Tourist || mongoose.model("Tourist", TouristSchema);
