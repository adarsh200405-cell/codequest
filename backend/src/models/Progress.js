import mongoose from "mongoose";

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lessonSlug: { type: String, required: true },
  completed: { type: Boolean, default: false },
  bestScore: { type: Number, default: 0 },
  attempts: { type: Number, default: 0 },
  completedAt: { type: Date, default: null }
}, { timestamps: true });

progressSchema.index({ userId: 1, lessonSlug: 1 }, { unique: true });
export default mongoose.model("Progress", progressSchema);
