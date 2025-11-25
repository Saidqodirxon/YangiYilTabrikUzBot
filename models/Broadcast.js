const mongoose = require("mongoose");

// Broadcast Schema - Xabar yuborish tarixi
const BroadcastSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: ["text", "photo", "video"],
      default: "text",
    },
    fileId: {
      type: String,
      default: null,
    },
    totalUsers: {
      type: Number,
      default: 0,
    },
    successCount: {
      type: Number,
      default: 0,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const Broadcast = mongoose.model("Broadcast", BroadcastSchema);

module.exports = Broadcast;
