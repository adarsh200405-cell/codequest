
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 60
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 254
  },

  passwordHash: {
    type: String,
    required: true,
    select: false
  },

  // Password reset token: hashed token is stored in MongoDB
  passwordResetToken: {
    type: String,
    default: null,
    select: false
  },

  // Reset link expires after 15 minutes
  passwordResetExpires: {
    type: Date,
    default: null,
    select: false
  },

  role: {
    type: String,
    enum: ["student", "admin"],
    default: "student"
  },

  classLevel: {
    type: Number,
    enum: [11, 12],
    default: 11
  }

}, { timestamps: true });

export default mongoose.model("User", userSchema);
