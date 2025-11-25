const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Admin Schema - Admin foydalanuvchilar
const AdminSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    login: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },
    password: {
      type: String,
      default: null,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      default: null,
    },
    username: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["superadmin", "admin", "moderator"],
      default: "moderator",
    },
    permissions: {
      canApprove: {
        type: Boolean,
        default: true,
      },
      canBlock: {
        type: Boolean,
        default: true,
      },
      canBroadcast: {
        type: Boolean,
        default: false,
      },
      canManageChannels: {
        type: Boolean,
        default: false,
      },
      canManageAdmins: {
        type: Boolean,
        default: false,
      },
      canManageTemplates: {
        type: Boolean,
        default: false,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    addedBy: {
      type: Number,
      default: null,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Password hash qilish pre-save hook
AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (!this.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Password solishtirish metodi
AdminSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model("Admin", AdminSchema);

module.exports = Admin;
