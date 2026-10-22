import mongoose from "mongoose";

const languageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  category: { type: String, required: true },
  difficulty: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
  tagline: { type: String, required: true },
  description: { type: String, required: true },
  uses: [{ type: String }],
  strengths: [{ type: String }],
  limitations: [{ type: String }],
  exampleCode: { type: String, default: "" },
  exampleOutput: { type: String, default: "" },
  isMarkupOrQueryLanguage: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Language", languageSchema);
