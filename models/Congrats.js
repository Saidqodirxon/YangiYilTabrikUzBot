const mongoose = require("mongoose");

// Congrats Schema - Tabriklar uchun
const CongratsSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true,
      ref: "User",
    },
    firstName: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      default: null,
    },
    messageType: {
      type: String,
      enum: ["text", "photo", "video"],
      default: "text",
    },
    message: {
      type: String,
      default: null,
    },
    fileId: {
      type: String,
      default: null,
    },
    caption: {
      type: String,
      default: null,
    },
    userApproved: {
      type: Boolean,
      default: false,
    },
    adminApproved: {
      type: Boolean,
      default: false,
    },
    rejectedByUser: {
      type: Boolean,
      default: false,
    },
    rejectedByAdmin: {
      type: Boolean,
      default: false,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    publishedToChannel: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const Congrats = mongoose.model("Congrats", CongratsSchema);

module.exports = Congrats;
