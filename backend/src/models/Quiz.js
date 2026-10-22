import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: Number, required: true },
  explanation: { type: String, required: true }
}, { _id: false });

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  lessonSlug: { type: String, default: "" },
  questions: { type: [questionSchema], required: true }
}, { timestamps: true });

export default mongoose.model("Quiz", quizSchema);
