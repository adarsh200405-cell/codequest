import { Router } from "express";
import Language from "../models/Language.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.q) filter.$or = [
      { name: { $regex: String(req.query.q), $options: "i" } },
      { tagline: { $regex: String(req.query.q), $options: "i" } },
      { uses: { $regex: String(req.query.q), $options: "i" } }
    ];
    res.json({ languages: await Language.find(filter).sort({ name: 1 }).lean() });
  } catch (error) { next(error); }
});
router.get("/:slug", async (req, res, next) => {
  try {
    const language = await Language.findOne({ slug: req.params.slug }).lean();
    if (!language) return res.status(404).json({ message: "Language not found." });
    res.json({ language });
  } catch (error) { next(error); }
});
router.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const language = await Language.create(req.body);
    res.status(201).json({ language });
  } catch (error) { next(error); }
});
export default router;
