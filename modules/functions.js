const User = require("../models/User");
const Congrats = require("../models/Congrats");
const Settings = require("../models/Settings");
const Channel = require("../models/Channel");
const Certificate = require("../models/Certificate");
const Broadcast = require("../models/Broadcast");
const Admin = require("../models/Admin");

// ============ USER FUNCTIONS ============

async function createUser(userId, firstName, username = null) {
  try {
    const existingUser = await User.findOne({ userId });
    if (existingUser) {
      return existingUser;
    }

    const newUser = new User({
      userId,
      firstName,
      username,
    });

    await newUser.save();
    console.log(`Yangi foydalanuvchi yaratildi: ${userId}`);
    return newUser;
  } catch (error) {
    console.error("User yaratishda xatolik:", error);
    throw error;
  }
}

async function getUser(userId) {
  try {
    const user = await User.findOne({ userId });
    return user;
  } catch (error) {
    console.error("User olishda xatolik:", error);
    throw error;
  }
}

async function updateUser(userId, updateData) {
  try {
    const user = await User.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true }
    );
    return user;
  } catch (error) {
    console.error("User yangilashda xatolik:", error);
    throw error;
  }
}

async function getAllUsers() {
  try {
    const users = await User.find({}); // Barcha userlarni olish (bloklangan ham)
    return users;
  } catch (error) {
    console.error("Userlarni olishda xatolik:", error);
    throw error;
  }
}

async function getUsersCount() {
  try {
    const count = await User.countDocuments({ is_block: false }); // Faqat faol userlar
    return count;
  } catch (error) {
    console.error("Userlarni sanashda xatolik:", error);
    return 0;
  }
}

async function blockUser(userId) {
  try {
    const user = await User.findOneAndUpdate(
      { userId },
      { $set: { is_block: true } },
      { new: true }
    );
    console.log(`User bloklandi: ${userId}`);
    return user;
  } catch (error) {
    console.error("User bloklashda xatolik:", error);
    throw error;
  }
}

async function unblockUser(userId) {
  try {
    const user = await User.findOneAndUpdate(
      { userId },
      { $set: { is_block: false } },
      { new: true }
    );
    console.log(`User blokdan chiqarildi: ${userId}`);
    return user;
  } catch (error) {
    console.error("User blokdan chiqarishda xatolik:", error);
    throw error;
  }
}

// ============ CONGRATS FUNCTIONS ============

async function createCongrats(congratsData) {
  try {
    const newCongrats = new Congrats(congratsData);
    await newCongrats.save();
    console.log(`Yangi tabrik yaratildi: ${newCongrats._id}`);
    return newCongrats;
  } catch (error) {
    console.error("Tabrik yaratishda xatolik:", error);
    throw error;
  }
}

async function getCongrats(congratsId) {
  try {
    const congrats = await Congrats.findById(congratsId);
    return congrats;
  } catch (error) {
    console.error("Tabrikni olishda xatolik:", error);
    throw error;
  }
}

async function updateCongrats(congratsId, updateData) {
  try {
    const congrats = await Congrats.findByIdAndUpdate(
      congratsId,
      { $set: updateData },
      { new: true }
    );
    return congrats;
  } catch (error) {
    console.error("Tabrikni yangilashda xatolik:", error);
    throw error;
  }
}

async function getPendingCongratsForAdmin() {
  try {
    const congrats = await Congrats.find({
      userApproved: true,
      adminApproved: false,
      rejectedByAdmin: false,
    }).sort({ createdAt: 1 });
    return congrats;
  } catch (error) {
    console.error("Kutilayotgan tabriklarni olishda xatolik:", error);
    throw error;
  }
}

async function getApprovedCongratsCount() {
  try {
    const count = await Congrats.countDocuments({
      userApproved: true,
      adminApproved: true,
      publishedToChannel: true,
    });
    return count;
  } catch (error) {
    console.error("Tasdiqlangan tabriklarni sanashda xatolik:", error);
    return 0;
  }
}

async function getPendingCongratsCount() {
  try {
    const count = await Congrats.countDocuments({
      userApproved: true,
      adminApproved: false,
      rejectedByAdmin: false,
    });
    return count;
  } catch (error) {
    console.error("Kutilayotgan tabriklarni sanashda xatolik:", error);
    return 0;
  }
}

async function getUserCongrats(userId) {
  try {
    const congrats = await Congrats.find({ userId }).sort({ createdAt: -1 });
    return congrats;
  } catch (error) {
    console.error("User tabriklarini olishda xatolik:", error);
    throw error;
  }
}

// ============ SETTINGS FUNCTIONS ============

async function getSetting(key) {
  try {
    const setting = await Settings.findOne({ key });
    return setting ? setting.value : null;
  } catch (error) {
    console.error("Sozlamani olishda xatolik:", error);
    return null;
  }
}

async function setSetting(key, value, description = null) {
  try {
    const setting = await Settings.findOneAndUpdate(
      { key },
      { $set: { value, description } },
      { new: true, upsert: true }
    );
    return setting;
  } catch (error) {
    console.error("Sozlamani saqlashda xatolik:", error);
    throw error;
  }
}

// ============ CHANNEL FUNCTIONS ============

async function createChannel(channelData) {
  try {
    const channel = new Channel(channelData);
    await channel.save();
    return channel;
  } catch (error) {
    console.error("Kanal yaratishda xatolik:", error);
    throw error;
  }
}

async function getChannel(channelId) {
  try {
    const channel = await Channel.findOne({ channelId });
    return channel;
  } catch (error) {
    console.error("Kanalni olishda xatolik:", error);
    throw error;
  }
}

async function getAllChannels() {
  try {
    const channels = await Channel.find({ isActive: true }).sort({ order: 1 });
    return channels;
  } catch (error) {
    console.error("Kanallarni olishda xatolik:", error);
    return [];
  }
}

async function getRequiredChannels() {
  try {
    const channels = await Channel.find({
      isRequired: true,
      isActive: true,
    }).sort({ order: 1 });
    return channels;
  } catch (error) {
    console.error("Majburiy kanallarni olishda xatolik:", error);
    return [];
  }
}

async function updateChannel(channelId, updateData) {
  try {
    const channel = await Channel.findOneAndUpdate(
      { channelId },
      { $set: updateData },
      { new: true }
    );
    return channel;
  } catch (error) {
    console.error("Kanalni yangilashda xatolik:", error);
    throw error;
  }
}

async function deleteChannel(channelId) {
  try {
    await Channel.findOneAndUpdate(
      { channelId },
      { $set: { isActive: false } }
    );
    return true;
  } catch (error) {
    console.error("Kanalni o'chirishda xatolik:", error);
    throw error;
  }
}

// ============ CERTIFICATE FUNCTIONS ============

async function createCertificate(certificateData) {
  try {
    const certificate = new Certificate(certificateData);
    await certificate.save();
    return certificate;
  } catch (error) {
    console.error("Sertifikat yaratishda xatolik:", error);
    throw error;
  }
}

async function getCertificate(templateNumber) {
  try {
    const certificate = await Certificate.findOne({
      templateNumber,
      isActive: true,
    });
    return certificate;
  } catch (error) {
    console.error("Sertifikatni olishda xatolik:", error);
    throw error;
  }
}

async function getAllCertificates() {
  try {
    const certificates = await Certificate.find({ isActive: true }).sort({
      templateNumber: 1,
    });
    return certificates;
  } catch (error) {
    console.error("Sertifikatlarni olishda xatolik:", error);
    return [];
  }
}

async function updateCertificate(templateNumber, updateData) {
  try {
    const certificate = await Certificate.findOneAndUpdate(
      { templateNumber },
      { $set: updateData },
      { new: true }
    );
    return certificate;
  } catch (error) {
    console.error("Sertifikatni yangilashda xatolik:", error);
    throw error;
  }
}

async function updateCertificateById(id, updateData) {
  try {
    const certificate = await Certificate.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );
    return certificate;
  } catch (error) {
    console.error("Sertifikatni ID bo'yicha yangilashda xatolik:", error);
    throw error;
  }
}

// ============ BROADCAST FUNCTIONS ============

async function createBroadcast(broadcastData) {
  try {
    const broadcast = new Broadcast(broadcastData);
    await broadcast.save();
    return broadcast;
  } catch (error) {
    console.error("Broadcast yaratishda xatolik:", error);
    throw error;
  }
}

async function updateBroadcast(broadcastId, updateData) {
  try {
    const broadcast = await Broadcast.findByIdAndUpdate(
      broadcastId,
      { $set: updateData },
      { new: true }
    );
    return broadcast;
  } catch (error) {
    console.error("Broadcast yangilashda xatolik:", error);
    throw error;
  }
}

async function getBroadcastStats() {
  try {
    const total = await Broadcast.countDocuments();
    const completed = await Broadcast.countDocuments({ status: "completed" });
    const lastBroadcast = await Broadcast.findOne().sort({ createdAt: -1 });

    return {
      total,
      completed,
      lastBroadcast,
    };
  } catch (error) {
    console.error("Broadcast statistikasini olishda xatolik:", error);
    return { total: 0, completed: 0, lastBroadcast: null };
  }
}

// ============ ADMIN FUNCTIONS ============

async function createAdmin(userId, firstName, addedBy, data = {}) {
  try {
    const existingAdmin = await Admin.findOne({ userId });
    if (existingAdmin) {
      return existingAdmin;
    }

    const newAdmin = new Admin({
      userId,
      firstName,
      lastName: data.lastName || null,
      username: data.username || null,
      role: data.role || "moderator",
      permissions: data.permissions || {},
      addedBy,
    });

    await newAdmin.save();
    console.log(`Yangi admin yaratildi: ${userId}`);
    return newAdmin;
  } catch (error) {
    console.error("Admin yaratishda xatolik:", error);
    throw error;
  }
}

async function getAdmin(userId) {
  try {
    const admin = await Admin.findOne({ userId, isActive: true });
    return admin;
  } catch (error) {
    console.error("Admin olishda xatolik:", error);
    throw error;
  }
}

async function getAllAdmins() {
  try {
    const admins = await Admin.find().sort({ createdAt: -1 });
    return admins;
  } catch (error) {
    console.error("Adminlarni olishda xatolik:", error);
    return [];
  }
}

async function updateAdmin(userId, updateData) {
  try {
    const admin = await Admin.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true }
    );
    return admin;
  } catch (error) {
    console.error("Admin yangilashda xatolik:", error);
    throw error;
  }
}

async function deleteAdmin(userId) {
  try {
    // Admin'ni o'chirish o'rniga isActive: false qilib qo'yamiz
    const admin = await Admin.findOneAndUpdate(
      { userId },
      { $set: { isActive: false } },
      { new: true }
    );
    return admin;
  } catch (error) {
    console.error("Admin o'chirishda xatolik:", error);
    throw error;
  }
}

async function checkAdminPermission(userId, permission) {
  try {
    const admin = await getAdmin(userId);
    if (!admin || !admin.isActive) {
      return false;
    }

    // Superadmin barcha huquqlarga ega
    if (admin.role === "superadmin") {
      return true;
    }

    // Maxsus permission tekshirish
    return admin.permissions[permission] === true;
  } catch (error) {
    console.error("Admin permission tekshirishda xatolik:", error);
    return false;
  }
}

module.exports = {
  createUser,
  getUser,
  updateUser,
  getAllUsers,
  getUsersCount,
  blockUser,
  unblockUser,
  createCongrats,
  getCongrats,
  updateCongrats,
  getPendingCongratsForAdmin,
  getApprovedCongratsCount,
  getPendingCongratsCount,
  getUserCongrats,
  getSetting,
  setSetting,
  createChannel,
  getChannel,
  getAllChannels,
  getRequiredChannels,
  updateChannel,
  deleteChannel,
  createCertificate,
  getCertificate,
  getAllCertificates,
  updateCertificate,
  updateCertificateById,
  createBroadcast,
  updateBroadcast,
  getBroadcastStats,
  createAdmin,
  getAdmin,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  checkAdminPermission,
};
