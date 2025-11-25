const mongoose = require("mongoose");

// Certificate Schema - Tabriknoma shablonlari
const CertificateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    templateNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    imagePath: {
      type: String,
      required: true,
    },
    width: {
      type: Number,
      default: 1920,
    },
    height: {
      type: Number,
      default: 1080,
    },
    textConfig: {
      fontFamily: {
        type: String,
        default: "Arial",
      },
      fontPath: {
        type: String,
        default: null,
      },
      fontSize: {
        type: Number,
        default: 48,
      },
      fontColor: {
        type: String,
        default: "#000000",
      },
      x: {
        type: Number,
        default: 0,
      },
      y: {
        type: Number,
        default: 0,
      },
      align: {
        type: String,
        enum: ["left", "center", "right"],
        default: "center",
      },
      maxWidth: {
        type: Number,
        default: 800,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
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

const Certificate = mongoose.model("Certificate", CertificateSchema);

module.exports = Certificate;
