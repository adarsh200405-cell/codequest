import { Router } from "express";
import Progress from "../models/Progress.js";
import Lesson from "../models/Lesson.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const progress = await Progress.find({ userId: req.user._id }).sort({ updatedAt: -1 }).lean();
    res.json({ progress });
  } catch (error) { next(error); }
});
router.post("/complete", requireAuth, async (req, res, next) => {
  try {
    const lessonSlug = String(req.body.lessonSlug || "");
    const lesson = await Lesson.findOne({ slug: lessonSlug, published: true });
    if (!lesson) return res.status(404).json({ message: "Lesson not found." });
    const progress = await Progress.findOneAndUpdate(
      { userId: req.user._id, lessonSlug },
      { $set: { completed: true, completedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ progress });
  } catch (error) { next(error); }
});
export default router;
