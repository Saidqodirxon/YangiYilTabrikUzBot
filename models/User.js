const mongoose = require("mongoose");

// User Schema
const UserSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      default: null,
    },
    is_block: {
      type: Boolean,
      default: false,
    },
    language: {
      type: String,
      enum: ["uz", "cr", "ru"],
      default: "uz",
    },
    location: {
      type: String,
      default: null,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
