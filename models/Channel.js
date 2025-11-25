const mongoose = require("mongoose");

// Channel Schema - Majburiy kanallar
const ChannelSchema = new mongoose.Schema(
  {
    channelId: {
      type: String,
      required: true,
      unique: true,
    },
    channelUsername: {
      type: String,
      required: true,
    },
    channelName: {
      type: String,
      required: true,
    },
    channelIcon: {
      type: String,
      default: "📢",
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const Channel = mongoose.model("Channel", ChannelSchema);

module.exports = Channel;
