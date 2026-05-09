import mongoose from "mongoose";

const SavedPlaceSchema = new mongoose.Schema(
  {
    userId: { type: String, index: true, default: "guest" },
    placeId: { type: String, required: true, index: true },
    category: { type: String, required: true },
    place: { type: Object, default: {} },
    savedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SavedPlaceSchema.index({ userId: 1, placeId: 1 }, { unique: true });

export default mongoose.models.SavedPlace || mongoose.model("SavedPlace", SavedPlaceSchema);
