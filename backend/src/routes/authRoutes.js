
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const RESET_TOKEN_EXPIRY_MINUTES = 15;

// Public user data only
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  classLevel: user.classLevel,
});

// Validate email
const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Escape HTML in email content
const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

// Create login JWT
const makeToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in backend/.env");
  }

  return jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Configure Gmail SMTP
function createMailer() {
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_APP_PASSWORD;

  if (!emailUser || !emailPassword) {
    throw new Error(
      "EMAIL_USER or EMAIL_APP_PASSWORD is missing in backend/.env"
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPassword.replace(/\s/g, ""),
    },
  });
}

// SIGNUP
router.post("/signup", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const classLevel = Number(req.body.classLevel || 11);

    if (name.length < 2) {
      return res.status(400).json({
        message: "Name must be at least 2 characters.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Enter a valid email.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
      });
    }

    if (![11, 12].includes(classLevel)) {
      return res.status(400).json({
        message: "Class must be 11 or 12.",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      passwordHash,
      classLevel,
    });

    return res.status(201).json({
      token: makeToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
});

// LOGIN
router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    const user = await User.findOne({ email }).select("+passwordHash");

    if (
      !user ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    return res.json({
      token: makeToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
});

// REQUEST PASSWORD RESET EMAIL
router.post("/forgot-password", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    const message =
      "If an account exists for this email, a password reset link will be sent.";

    if (!isValidEmail(email)) {
      return res.json({ message });
    }

    const user = await User.findOne({ email });

    // Do not reveal whether an account exists
    if (!user) {
      return res.json({ message });
    }

    // Generate a cryptographically secure, 64-character token
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Store only the token hash in MongoDB
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(
      Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000
    );

    await user.save();

    // Must match the actual Live Server frontend URL
    const resetUrl =
  `http://127.0.0.1:5500/CodeQuest-MERN/frontend/reset-password.html?token=${rawToken}`;

    try {
      const mailer = createMailer();

      const info = await mailer.sendMail({
        from: `"CodeQuest" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Reset your CodeQuest password",
        text:
          `Hello ${user.name},\n\n` +
          "Use this link to reset your CodeQuest password:\n" +
          `${resetUrl}\n\n` +
          `This link expires in ${RESET_TOKEN_EXPIRY_MINUTES} minutes ` +
          "and can only be used once.\n" +
          "If you did not request this, ignore this email.",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
            <h2>Reset your CodeQuest password</h2>
            <p>Hello ${escapeHtml(user.name)},</p>
            <p>
              Click the button below to reset your password.
              This link expires in ${RESET_TOKEN_EXPIRY_MINUTES} minutes.
            </p>
            <p>
              <a href="${resetUrl}"
                 style="display:inline-block;padding:12px 20px;
                 background:#2563eb;color:#ffffff;text-decoration:none;
                 border-radius:8px">
                Reset Password
              </a>
            </p>
            <p>If you did not request this, ignore this email.</p>
          </div>
        `,
      });

      console.log("Reset email accepted:", info.accepted);
      console.log("Reset email rejected:", info.rejected);
    } catch (mailError) {
      // Invalidate the token if email delivery fails
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();

      throw mailError;
    }

    return res.json({ message });
  } catch (error) {
    console.error("Forgot-password error:", error.message);
    next(error);
  }
});

// RESET PASSWORD
router.post("/reset-password", async (req, res, next) => {
  try {
    const token = String(req.body.token || "").trim();
    const password = String(req.body.password || "");
    const confirmPassword = req.body.confirmPassword;

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        message: "Reset link is invalid or expired. Request a new one.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
      });
    }

    if (
      confirmPassword !== undefined &&
      password !== String(confirmPassword)
    ) {
      return res.status(400).json({
        message: "Passwords do not match.",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      return res.status(400).json({
        message: "Reset link is invalid or expired. Request a new one.",
      });
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await user.save();

    return res.json({
      message: "Password reset successful. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
});

// CURRENT USER
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
