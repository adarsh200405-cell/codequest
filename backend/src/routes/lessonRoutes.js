import { Router } from "express";
import Lesson from "../models/Lesson.js";

const router = Router();
router.get("/", async (req, res, next) => {
  try {
    const filter = { published: true };
    if (req.query.languageSlug) filter.languageSlug = String(req.query.languageSlug);
    if (req.query.classLevel && [11, 12].includes(Number(req.query.classLevel))) {
      filter.classLevels = Number(req.query.classLevel);
    }
    res.json({ lessons: await Lesson.find(filter).sort({ createdAt: 1 }).lean() });
  } catch (error) { next(error); }
});
router.get("/:slug", async (req, res, next) => {
  try {
    const lesson = await Lesson.findOne({ slug: req.params.slug, published: true }).lean();
    if (!lesson) return res.status(404).json({ message: "Lesson not found." });
    res.json({ lesson });
  } catch (error) { next(error); }
});
export default router;
