import { Router } from "express";
import Quiz from "../models/Quiz.js";
import Progress from "../models/Progress.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.get("/", async (_req, res, next) => {
  try {
    const quizzes = await Quiz.find().select("title slug lessonSlug").lean();
    res.json({ quizzes });
  } catch (error) { next(error); }
});
router.get("/:slug", async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ slug: req.params.slug }).lean();
    if (!quiz) return res.status(404).json({ message: "Quiz not found." });
    res.json({ quiz: { title: quiz.title, slug: quiz.slug, lessonSlug: quiz.lessonSlug,
      questions: quiz.questions.map(({ question, options }) => ({ question, options })) } });
  } catch (error) { next(error); }
});
router.post("/:slug/submit", requireAuth, async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ slug: req.params.slug });
    if (!quiz) return res.status(404).json({ message: "Quiz not found." });
    const answers = req.body.answers;
    if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
      return res.status(400).json({ message: "Submit one answer for each question." });
    }
    let score = 0;
    const results = quiz.questions.map((question, index) => {
      const correct = Number(answers[index]) === question.correctAnswer;
      if (correct) score++;
      return { correct, correctAnswer: question.correctAnswer, explanation: question.explanation };
    });
    if (quiz.lessonSlug) {
      await Progress.findOneAndUpdate(
        { userId: req.user._id, lessonSlug: quiz.lessonSlug },
        { $set: { bestScore: Math.max(score, 0) }, $inc: { attempts: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    res.json({ score, total: quiz.questions.length, percentage: Math.round(score / quiz.questions.length * 100), results });
  } catch (error) { next(error); }
});
export default router;
