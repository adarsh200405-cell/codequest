
import { Router } from "express";
import { createHash } from "node:crypto";
import Quiz from "../models/Quiz.js";
import Progress from "../models/Progress.js";
import QuizHistory from "../models/QuizHistory.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function getQuestionId(question) {
  return createHash("sha256")
    .update(
      JSON.stringify([
        question.question,
        question.options,
        question.correctAnswer,
        question.explanation
      ])
    )
    .digest("hex");
}

function shuffle(items) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

// GET /api/quizzes
router.get("/", async (_req, res, next) => {
  try {
    const quizzes = await Quiz.find()
      .select("title slug lessonSlug")
      .maxTimeMS(5000)
      .lean();

    res.json({ quizzes });
  } catch (error) {
    next(error);
  }
});

// GET /api/quizzes/:slug
router.get("/:slug", requireAuth, async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ slug: req.params.slug })
      .maxTimeMS(5000)
      .lean();

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    const questions = (quiz.questions || []).map(question => ({
      ...question,
      id: getQuestionId(question)
    }));

    if (questions.length === 0) {
      return res.status(400).json({
        message: "This quiz has no questions."
      });
    }

    let history = await QuizHistory.findOne({
      userId: req.user._id,
      quizSlug: quiz.slug
    });

    if (!history) {
      history = await QuizHistory.create({
        userId: req.user._id,
        quizSlug: quiz.slug,
        usedQuestionIds: []
      });
    }

    const used = new Set(history.usedQuestionIds || []);
    let available = questions.filter(question => !used.has(question.id));
    let cycleRestarted = false;

    if (available.length === 0) {
      history.usedQuestionIds = [];
      await history.save();

      available = questions;
      cycleRestarted = true;
    }

    const selected = shuffle(available).slice(
      0,
      Math.min(5, available.length)
    );

    res.json({
      quiz: {
        title: quiz.title,
        slug: quiz.slug,
        lessonSlug: quiz.lessonSlug,
        questions: selected.map(question => ({
          id: question.id,
          question: question.question,
          options: question.options
        }))
      },
      cycleRestarted
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/quizzes/:slug/submit
router.post("/:slug/submit", requireAuth, async (req, res, next) => {
  try {
    const { answers, questionIds } = req.body;

    if (
      !Array.isArray(answers) ||
      !Array.isArray(questionIds) ||
      answers.length === 0 ||
      answers.length !== questionIds.length ||
      new Set(questionIds).size !== questionIds.length ||
      !questionIds.every(
        id => typeof id === "string" && /^[a-f0-9]{64}$/.test(id)
      ) ||
      !answers.every(
        answer => Number.isInteger(answer) && answer >= 0
      )
    ) {
      return res.status(400).json({
        message: "Invalid answers or question list."
      });
    }

    const quiz = await Quiz.findOne({ slug: req.params.slug })
      .maxTimeMS(5000)
      .lean();

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    const questionMap = new Map(
      (quiz.questions || []).map(question => [
        getQuestionId(question),
        question
      ])
    );

    const submittedQuestions = questionIds.map(id => questionMap.get(id));

    if (submittedQuestions.some(question => !question)) {
      return res.status(400).json({
        message: "Questions do not match this quiz. Please reload it."
      });
    }

    if (
      answers.some(
        (answer, index) =>
          answer >= submittedQuestions[index].options.length
      )
    ) {
      return res.status(400).json({
        message: "An answer option is invalid."
      });
    }

    const score = submittedQuestions.reduce(
      (total, question, index) =>
        total + (answers[index] === question.correctAnswer ? 1 : 0),
      0
    );

    const results = submittedQuestions.map((question, index) => ({
      correct: answers[index] === question.correctAnswer,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation
    }));

    let history = await QuizHistory.findOne({
      userId: req.user._id,
      quizSlug: quiz.slug
    });

    if (!history) {
      history = new QuizHistory({
        userId: req.user._id,
        quizSlug: quiz.slug,
        usedQuestionIds: []
      });
    }

    const used = new Set(history.usedQuestionIds || []);
    questionIds.forEach(id => used.add(id));
    history.usedQuestionIds = [...used];

    await history.save();

    // Record the quiz score as lesson progress when a lesson is linked.
    if (quiz.lessonSlug) {
      await Progress.findOneAndUpdate(
        {
          userId: req.user._id,
          lessonSlug: quiz.lessonSlug
        },
        {
          $set: {
            completed: score === submittedQuestions.length,
            completedAt:
              score === submittedQuestions.length ? new Date() : null
          }
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );
    }

    res.json({
      score,
      total: submittedQuestions.length,
      percentage: Math.round(
        (score / submittedQuestions.length) * 100
      ),
      results
    });
  } catch (error) {
    next(error);
  }
});

export default router;
