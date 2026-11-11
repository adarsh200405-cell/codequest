import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema({
  languageSlug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  languageName: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  playlistUrl: { type: String, required: true, trim: true },
  playlistId: { type: String, default: "" },
  level: { type: String, enum: ["Beginner", "Intermediate", "Advanced", "All levels"], default: "Beginner" },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Playlist", playlistSchema);
