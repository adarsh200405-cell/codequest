import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import authRoutes from "./src/routes/authRoutes.js";
import languageRoutes from "./src/routes/languageRoutes.js";
import lessonRoutes from "./src/routes/lessonRoutes.js";
import quizRoutes from "./src/routes/quizRoutes.js";
import progressRoutes from "./src/routes/progressRoutes.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://127.0.0.1:5500" }));
app.use(express.json({ limit: "100kb" }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 50 }), authRoutes);
app.use("/api/languages", languageRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/progress", progressRoutes);

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "CodeQuest API" }));
app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

const port = Number(process.env.PORT || 5000);
if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  console.error("Missing MONGODB_URI or JWT_SECRET. Copy .env.example to .env and configure it.");
  process.exit(1);
}
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(port, () => console.log(`CodeQuest API running at http://localhost:${port}`));
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
