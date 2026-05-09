import mongoose from "mongoose";

const RecommendationSearchHistorySchema = new mongoose.Schema(
  {
    userId: { type: String, index: true, default: "guest" },
    searchQuery: { type: String, required: true },
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  { timestamps: { createdAt: "timestamp", updatedAt: false } }
);

export default mongoose.models.RecommendationSearchHistory ||
  mongoose.model("RecommendationSearchHistory", RecommendationSearchHistorySchema);
