import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  languageSlug: { type: String, required: true },
  classLevels: [{ type: Number, enum: [11, 12] }],
  difficulty: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
  estimatedMinutes: { type: Number, default: 10 },
  summary: { type: String, required: true },
  content: [{ heading: String, body: String }],
  published: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Lesson", lessonSchema);
