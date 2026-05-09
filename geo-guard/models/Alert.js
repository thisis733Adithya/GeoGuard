import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema(
  {
    touristId: { type: String, required: true, index: true },
    touristName: String,
    type: { type: String, required: true },
    severity: { type: String, enum: ["normal", "warning", "critical"], default: "normal" },
    message: { type: String, required: true },
    suggestion: String,
    status: { type: String, enum: ["open", "acknowledged", "resolved"], default: "open" },
    location: {
      latitude: Number,
      longitude: Number,
    },
    zoneId: String,
  },
  { timestamps: true }
);

export default mongoose.models.Alert || mongoose.model("Alert", AlertSchema);
