const mongoose = require("mongoose");

// Settings Schema - Bot sozlamalari uchun
const SettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const Settings = mongoose.model("Settings", SettingsSchema);

module.exports = Settings;
