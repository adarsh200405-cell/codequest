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
import playlistRoutes from "./src/routes/playlistRoutes.js";

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://127.0.0.1:5500")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin not allowed by CORS"));
  }
}));

app.use(express.json({ limit: "100kb" }));

let databaseConnection;

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (!databaseConnection) {
    databaseConnection = mongoose.connect(process.env.MONGODB_URI)
      .catch(error => {
        databaseConnection = null;
        throw error;
      });
  }

  await databaseConnection;
}

// Ensure the database is ready before processing API requests.
app.use(async (_req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    res.status(503).json({
      message: "Database connection unavailable. Please try again."
    });
  }
});

app.use("/api/auth", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50
}), authRoutes);

app.use("/api/languages", languageRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/playlists", playlistRoutes);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "CodeQuest API",
    database: "connected"
  });
});

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error"
  });
});

// Vercel uses the exported Express application.
// Locally, start the normal Express server.
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT || 5000);

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing from your .env file.");
    process.exit(1);
  }

  connectDatabase()
    .then(() => {
      console.log("MongoDB connected");
      app.listen(port, () => {
        console.log(`CodeQuest API running at http://localhost:${port}`);
      });
    })
    .catch(error => {
      console.error("MongoDB connection failed:", error.message);
      process.exit(1);
    });
}

export default app;