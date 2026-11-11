import { Router } from "express";
import Playlist from "../models/Playlist.js";
import Language from "../models/Language.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

function getPlaylistId(value = "") {
  try {
    const url = new URL(value);
    if (!/(^|\.)youtube\.com$|(^|\.)youtube-nocookie\.com$/.test(url.hostname)) return "";
    return url.searchParams.get("list") || "";
  } catch { return ""; }
}

// Public directory: one playlist record per CodeQuest language.
router.get("/", async (_req, res, next) => {
  try {
    const playlists = await Playlist.find({ active: true }).sort({ languageName: 1 }).lean();
    res.json({ playlists });
  } catch (error) { next(error); }
});

router.get("/:languageSlug", async (req, res, next) => {
  try {
    const playlist = await Playlist.findOne({ languageSlug: req.params.languageSlug.toLowerCase(), active: true }).lean();
    if (!playlist) return res.status(404).json({ message: "Playlist not found for this language." });
    res.json({ playlist });
  } catch (error) { next(error); }
});

// Admins can add/update a real playlist URL. Use a YouTube playlist URL containing ?list=PLAYLIST_ID to enable embedding.
router.put("/:languageSlug", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const languageSlug = String(req.params.languageSlug || "").toLowerCase().trim();
    const language = await Language.findOne({ slug: languageSlug }).lean();
    if (!language) return res.status(404).json({ message: "Language not found in CodeQuest." });
    const playlistUrl = String(req.body.playlistUrl || "").trim();
    let parsed;
    try { parsed = new URL(playlistUrl); } catch { return res.status(400).json({ message: "Enter a valid YouTube playlist or search URL." }); }
    if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(parsed.hostname)) {
      return res.status(400).json({ message: "Playlist URL must be from YouTube." });
    }
    const playlistId = getPlaylistId(playlistUrl);
    const playlist = await Playlist.findOneAndUpdate(
      { languageSlug },
      { $set: { languageSlug, languageName: language.name, title: String(req.body.title || `${language.name} complete course playlist`).trim(), description: String(req.body.description || "").trim(), playlistUrl, playlistId, level: req.body.level || "Beginner", active: req.body.active !== false } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();
    res.json({ playlist, message: "Playlist saved." });
  } catch (error) { next(error); }
});

export default router;
