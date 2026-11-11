
import mongoose from "mongoose";

const quizHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  quizSlug: {
    type: String,
    required: true
  },
  usedQuestionIds: {
    type: [String],
    default: []
  }
}, { timestamps: true });

quizHistorySchema.index(
  { userId: 1, quizSlug: 1 },
  { unique: true }
);

export default mongoose.model("QuizHistory", quizHistorySchema);
