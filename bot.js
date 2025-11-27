const { Telegraf, Scenes, session, Markup } = require("telegraf");
require("dotenv/config");
const axios = require("axios");
const moment = require("moment-timezone");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Database
const db = require("./modules/db");
const {
  createUser,
  getUser,
  updateUser,
  getAllUsers,
  getUsersCount,
  createCongrats,
  getCongrats,
  updateCongrats,
  getPendingCongratsForAdmin,
  getApprovedCongratsCount,
  getPendingCongratsCount,
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
  getAdmin,
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  checkAdminPermission,
  blockUser,
  unblockUser,
} = require("./modules/functions");
const {
  generateCertificate,
  getImageInfo,
} = require("./modules/imageProcessor");
const Admin = require("./models/Admin");
const Certificate = require("./models/Certificate");
const Channel = require("./models/Channel");

const bot = new Telegraf(process.env.BOT_TOKEN);
db();

// Timezone configuration - Always use Tashkent timezone
const TIMEZONE = "Asia/Tashkent";
moment.tz.setDefault(TIMEZONE);

// Helper function to get current time in Tashkent
const getTashkentTime = () => moment.tz(TIMEZONE);

// Environment variables
const adminUser = process.env.ADMIN_USER;
const adminId = parseInt(process.env.ADMIN_ID);
const adminGroupId = process.env.ADMIN_GROUP_ID || null; // Admin group for notifications
const botUser = process.env.BOT_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET || "bayramona-jwt-secret-key-2025";
const ADMIN_PORT = process.env.ADMIN_PORT || 9809;

// Telegram limits
const TELEGRAM_RATE_LIMIT = 30; // 30 xabar per soniya
const BATCH_DELAY = 1000; // 1 soniya

// Uploads papkasini yaratish va eski generated rasmlarni tozalash
const uploadsDir = path.join(__dirname, "uploads");
const templatesDir = path.join(uploadsDir, "templates");
const fontsDir = path.join(uploadsDir, "fonts");
const generatedDir = path.join(uploadsDir, "generated");

[uploadsDir, templatesDir, fontsDir, generatedDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 1 soatdan eski generated rasmlarni avtomatik o'chirish
setInterval(() => {
  try {
    const files = fs.readdirSync(generatedDir);
    const now = Date.now();
    files.forEach((file) => {
      const filePath = path.join(generatedDir, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > 60 * 60 * 1000) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (e) {
    // ignore
  }
}, 10 * 60 * 1000); // har 10 daqiqada tekshiradi

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = req.body.type || "templates";
    const dir = type === "font" ? fontsDir : templatesDir;
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedImages = /jpeg|jpg|png|gif|webp/;
    const allowedFonts = /ttf|otf|woff|woff2/;
    const extname = path.extname(file.originalname).toLowerCase();

    if (file.fieldname === "font") {
      if (allowedFonts.test(extname.slice(1))) {
        return cb(null, true);
      }
    } else if (file.fieldname === "image") {
      if (allowedImages.test(extname.slice(1))) {
        return cb(null, true);
      }
    }

    cb(new Error("Faqat rasm yoki font fayllari!"));
  },
});

const tumanData = {
  regions: [
    "Toshkent",
    "Samarqand",
    "Buxoro",
    "Andijon",
    "Farg'ona",
    "Namangan",
    "Qo'qon",
    "Urganch",
    "Nukus",
    "Qarshi",
    "Termiz",
    "Jizzax",
    "Guliston",
    "Navoiy",
    "Xiva",
    "Denov",
    "Marg'ilon",
    "Bekobod",
    "Angren",
  ],
};

// ============ HELPER FUNCTIONS ============

async function isAdmin(userId) {
  // Asosiy adminmi tekshirish
  if (parseInt(userId) === adminId) {
    return true;
  }

  // Database'dan admin bo'lsa-yo'qligini tekshirish
  const admin = await getAdmin(userId);
  return !!admin;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============ EXPRESS API SERVER ============
const app = express();

// CORS Configuration
const corsOptions = {
  origin: [
    "http://localhost:9809",
    "http://45.153.190.132:9809",
    "http://localhost:5174",
    "http://localhost:9808",
    "https://yangiyilbot.saidqodirxon.uz",
    "https://yangiyilbotadmin.saidqodirxon.uz",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// JWT middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Token topilmadi" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Token noto'g'ri yoki muddati o'tgan",
      });
    }
    req.user = user;
    next();
  });
}

// Health check endpoint
app.get("/health", (req, res) => {
  return res.json({
    ok: true,
    uptime: process.uptime(),
    botUser: process.env.BOT_USER || null,
  });
});

app.get("/", (req, res) => {
  res.send("Bot + Admin API running");
});

// ============ API ROUTES ============

// Login API
app.post("/api/auth/login", async (req, res) => {
  try {
    const { login, password } = req.body;

    if (login && password) {
      const admin = await Admin.findOne({ login, isActive: true });

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Login yoki parol noto'g'ri!",
        });
      }

      const isMatch = await admin.comparePassword(password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Login yoki parol noto'g'ri!",
        });
      }

      admin.lastLogin = getTashkentTime().toDate();
      await admin.save();

      const token = jwt.sign(
        {
          userId: admin.userId,
          login: admin.login,
          role: admin.role,
          permissions: admin.permissions,
          timestamp: Date.now(),
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      return res.json({
        success: true,
        token,
        user: {
          userId: admin.userId,
          login: admin.login,
          firstName: admin.firstName,
          role: admin.role,
          permissions: admin.permissions,
        },
        message: "Login muvaffaqiyatli",
      });
    }

    if (password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        { admin: true, timestamp: Date.now() },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      return res.json({
        success: true,
        token,
        message: "Login muvaffaqiyatli",
      });
    }

    res.status(401).json({
      success: false,
      message: "Noto'g'ri parol!",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server xatolik",
    });
  }
});

// Verify Token API
app.get("/api/auth/verify", authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// Stats API
app.get("/api/stats", authenticateToken, async (req, res) => {
  try {
    const userCount = await getUsersCount();
    const approvedCount = await getApprovedCongratsCount();
    const pendingCount = await getPendingCongratsCount();
    const broadcastStats = await getBroadcastStats();
    const channels = await getAllChannels();

    res.json({
      success: true,
      data: {
        users: userCount,
        approvedCongrats: approvedCount,
        pendingCongrats: pendingCount,
        broadcasts: broadcastStats,
        channels: channels.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Users API
app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const filter = req.query.filter || "all";

    let allUsers = await getAllUsers();

    if (filter === "active") {
      allUsers = allUsers.filter((u) => !u.is_block);
    } else if (filter === "blocked") {
      allUsers = allUsers.filter((u) => u.is_block);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      allUsers = allUsers.filter(
        (u) =>
          u.userId.toString().includes(search) ||
          (u.firstName && u.firstName.toLowerCase().includes(searchLower)) ||
          (u.lastName && u.lastName.toLowerCase().includes(searchLower)) ||
          (u.username && u.username.toLowerCase().includes(searchLower))
      );
    }

    const totalUsers = allUsers.length;
    const users = allUsers.slice(skip, skip + limit);
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      success: true,
      data: { users, currentPage: page, totalPages, totalUsers },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Block/Unblock User API
app.post("/api/users/:userId/block", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    await blockUser(parseInt(userId));
    res.json({ success: true, message: "User bloklandi" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/users/:userId/unblock", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    await unblockUser(parseInt(userId));
    res.json({ success: true, message: "User blokdan chiqarildi" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Congrats API
app.get("/api/congrats", authenticateToken, async (req, res) => {
  try {
    const congrats = await getPendingCongratsForAdmin();
    res.json({ success: true, data: congrats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/congrats/:id/approve", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const congrats = await getCongrats(id);

    if (!congrats) {
      return res
        .status(404)
        .json({ success: false, message: "Tabrik topilmadi" });
    }

    await updateCongrats(id, {
      adminApproved: true,
      rejectedByAdmin: false,
      publishedToChannel: true,
      publishedAt: getTashkentTime().toDate(),
    });

    try {
      const publishChannelIdSetting = await getSetting("publish_channel_id");
      const publishChannelId = publishChannelIdSetting || null;
      let targetChannel = null;

      if (publishChannelId) {
        targetChannel = await Channel.findOne({
          channelId: publishChannelId,
          isActive: true,
        });
      } else {
        targetChannel = await Channel.findOne({ isActive: true }).sort({
          order: 1,
        });
      }

      if (targetChannel) {
        try {
          let messageText = `🎊 Yangi tabrik!\n\n👤 ${congrats.firstName}`;
          if (congrats.username) messageText += ` (@${congrats.username})`;

          if (congrats.messageType === "text" && congrats.message) {
            messageText += `\n\n${congrats.message}`;
            await bot.telegram.sendMessage(
              targetChannel.channelId,
              messageText
            );
          } else if (congrats.messageType === "photo" && congrats.fileId) {
            await bot.telegram.sendPhoto(
              targetChannel.channelId,
              congrats.fileId,
              {
                caption:
                  messageText +
                  (congrats.caption ? `\n\n${congrats.caption}` : ""),
              }
            );
          } else if (congrats.messageType === "video" && congrats.fileId) {
            await bot.telegram.sendVideo(
              targetChannel.channelId,
              congrats.fileId,
              {
                caption:
                  messageText +
                  (congrats.caption ? `\n\n${congrats.caption}` : ""),
              }
            );
          }
        } catch (channelSendError) {
          // Channel send error
        }
      }
    } catch (channelError) {
      // Channel error
    }

    try {
      let channelLink = "";
      const publishChannelIdSetting = await getSetting("publish_channel_id");
      if (publishChannelIdSetting) {
        const targetChannel = await Channel.findOne({
          channelId: publishChannelIdSetting,
          isActive: true,
        });
        if (targetChannel && targetChannel.channelUsername) {
          channelLink = `\n\n📢 <a href="https://t.me/${targetChannel.channelUsername}">Tabrikingizni ko'rish</a>`;
        }
      }
      await bot.telegram.sendMessage(
        congrats.userId,
        `<b>✅ Tabrikingiz tasdiqlandi va kanalga joylandi!${channelLink}</b>`,
        { parse_mode: "HTML" }
      );
    } catch (notifyError) {
      // Notify error
    }

    res.json({
      success: true,
      message: "Tabrik tasdiqlandi va kanalga yuborildi",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/congrats/:id/reject", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const congrats = await getCongrats(id);

    if (!congrats) {
      return res
        .status(404)
        .json({ success: false, message: "Tabrik topilmadi" });
    }

    const rejectionReason = req.body.reason || "Qoidalarga mos kelmagan";

    await updateCongrats(id, {
      rejectedByAdmin: true,
      adminApproved: false,
      rejectionReason: rejectionReason,
    });

    try {
      await bot.telegram.sendMessage(
        congrats.userId,
        `<b>❌ Tabrikingiz admin tomonidan tasdiqlanmadi</b>\n\n<b>Sababi:</b> ${rejectionReason}\n\n💡 <i>Qayta urinib ko'ring va qoidalarga rioya qiling</i>`,
        { parse_mode: "HTML" }
      );
    } catch (notifyError) {
      // Notify error
    }

    res.json({ success: true, message: "Tabrik rad etildi" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Channels API
app.get("/api/channels", authenticateToken, async (req, res) => {
  try {
    const channels = await getAllChannels();
    res.json({ success: true, data: channels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/channels", authenticateToken, async (req, res) => {
  try {
    const {
      channelId,
      channelUsername,
      channelName,
      channelIcon,
      isRequired,
      order,
    } = req.body;

    if (!channelId || !channelUsername) {
      return res
        .status(400)
        .json({ success: false, message: "Channel ID va Username majburiy" });
    }

    await createChannel({
      channelId,
      channelUsername,
      channelName: channelName || channelUsername,
      channelIcon: channelIcon || "📢",
      isRequired: isRequired !== undefined ? isRequired : true,
      order: order || 1,
      isActive: true,
    });

    res.json({ success: true, message: "Kanal qo'shildi" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/channels/:id/toggle", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const channel = await getChannel(id);

    if (!channel) {
      return res
        .status(404)
        .json({ success: false, message: "Kanal topilmadi" });
    }

    await updateChannel(id, { isRequired: !channel.isRequired });
    res.json({ success: true, message: "Kanal holati o'zgartirildi" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/channels/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteChannel(id);
    res.json({ success: true, message: "Kanal o'chirildi" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Certificates API
app.get("/api/certificates", authenticateToken, async (req, res) => {
  try {
    const certificates = await getAllCertificates();
    res.json({ success: true, data: certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post(
  "/api/certificates",
  authenticateToken,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "font", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (!req.files || !req.files.image) {
        return res
          .status(400)
          .json({ success: false, message: "Rasm yuklanmadi" });
      }

      const { templateNumber, name, textConfig, width, height } = req.body;

      if (!templateNumber || !name) {
        if (req.files.image) fs.unlinkSync(req.files.image[0].path);
        if (req.files.font) fs.unlinkSync(req.files.font[0].path);
        return res
          .status(400)
          .json({
            success: false,
            message: "Template raqami va nomi majburiy",
          });
      }

      const imageInfo = await getImageInfo(req.files.image[0].path);

      if (!imageInfo.success) {
        if (req.files.image) fs.unlinkSync(req.files.image[0].path);
        if (req.files.font) fs.unlinkSync(req.files.font[0].path);
        return res
          .status(400)
          .json({
            success: false,
            message: "Rasm ma'lumotlarini olishda xatolik",
          });
      }

      let parsedTextConfig = {};
      if (textConfig) {
        try {
          parsedTextConfig = JSON.parse(textConfig);
        } catch (e) {
          parsedTextConfig = {};
        }
      }

      if (req.files.font) {
        parsedTextConfig.fontPath = req.files.font[0].path;
        parsedTextConfig.fontFamily = req.files.font[0].originalname.replace(
          /\.(ttf|otf)$/i,
          ""
        );
      }

      await createCertificate({
        templateNumber: parseInt(templateNumber),
        name: name,
        imagePath: req.files.image[0].path,
        width: width ? parseInt(width) : imageInfo.width,
        height: height ? parseInt(height) : imageInfo.height,
        textConfig: parsedTextConfig,
        isActive: true,
      });

      res.json({
        success: true,
        message: "Template qo'shildi",
        data: {
          path: req.files.image[0].path,
          width: width ? parseInt(width) : imageInfo.width,
          height: height ? parseInt(height) : imageInfo.height,
        },
      });
    } catch (error) {
      if (req.files) {
        if (req.files.image && fs.existsSync(req.files.image[0].path))
          fs.unlinkSync(req.files.image[0].path);
        if (req.files.font && fs.existsSync(req.files.font[0].path))
          fs.unlinkSync(req.files.font[0].path);
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

app.put("/api/certificates/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { textConfig, width, height } = req.body;

    const updateData = {};
    if (textConfig) updateData.textConfig = textConfig;
    if (width) updateData.width = width;
    if (height) updateData.height = height;

    await updateCertificateById(id, updateData);
    res.json({ success: true, message: "Template yangilandi" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/certificates/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const template = await Certificate.findById(id);

    if (!template) {
      return res
        .status(404)
        .json({ success: false, message: "Template topilmadi" });
    }

    try {
      if (fs.existsSync(template.imagePath)) fs.unlinkSync(template.imagePath);
    } catch (fileError) {
      // File delete error
    }

    await Certificate.findByIdAndDelete(id);
    res.json({ success: true, message: "Template o'chirildi" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate Certificate API
app.post("/api/generate-certificate", authenticateToken, async (req, res) => {
  try {
    const { templateId, text } = req.body;

    if (!templateId || !text) {
      return res
        .status(400)
        .json({ success: false, message: "Template ID va matn majburiy" });
    }

    const template = await Certificate.findById(templateId);
    if (!template || !template.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Template topilmadi" });
    }

    const outputFilename = `cert_${Date.now()}.png`;
    const outputPath = path.join(generatedDir, outputFilename);

    const result = await generateCertificate({
      imagePath: template.imagePath,
      text: text,
      textConfig: template.textConfig,
      outputPath: outputPath,
    });

    if (result.success) {
      res.json({
        success: true,
        message: "Sertifikat yaratildi",
        imageUrl: `/uploads/generated/${outputFilename}`,
      });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Broadcast API
app.get("/api/broadcast/stats", authenticateToken, async (req, res) => {
  try {
    const stats = await getBroadcastStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/broadcast", authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Xabar matni kiritilmagan" });
    }

    const users = await getAllUsers();
    let sent = 0;
    let failed = 0;

    const broadcast = await createBroadcast({
      message,
      totalUsers: users.length,
      sentCount: 0,
      failedCount: 0,
      status: "processing",
    });

    for (let i = 0; i < users.length; i++) {
      try {
        await bot.telegram.sendMessage(users[i].userId, message, {
          parse_mode: "HTML",
        });
        sent++;
        if ((i + 1) % 30 === 0)
          await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        failed++;
      }
    }

    await updateBroadcast(broadcast._id, {
      sentCount: sent,
      failedCount: failed,
      status: "completed",
      completedAt: getTashkentTime().toDate(),
    });

    res.json({
      success: true,
      message: "Xabar yuborish yakunlandi",
      sent,
      failed,
      total: users.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Font Upload API
app.post(
  "/api/upload-font",
  authenticateToken,
  upload.single("font"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Font fayli yuklanmadi" });
      }

      res.json({
        success: true,
        message: "Font yuklandi",
        data: {
          fontPath: req.file.path,
          fontName: req.file.originalname,
          relativePath: `/uploads/fonts/${req.file.filename}`,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// User Block/Unblock API (alternative)
app.put("/api/users/:id/block", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUser(id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User topilmadi" });
    }

    await updateUser(id, { is_block: !user.is_block });
    res.json({
      success: true,
      message: user.is_block ? "User blokdan chiqarildi" : "User bloklandi",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin Management API
app.get("/api/admins", authenticateToken, async (req, res) => {
  try {
    const admins = await getAllAdmins();
    res.json({ success: true, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/admins", authenticateToken, async (req, res) => {
  try {
    const { userId, firstName, lastName, username, role, permissions } =
      req.body;

    if (!userId || !firstName) {
      return res
        .status(400)
        .json({
          success: false,
          message: "userId va firstName talab qilinadi",
        });
    }

    const currentAdmin = await getAdmin(req.user.userId);
    if (!currentAdmin || currentAdmin.role !== "superadmin") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Faqat superadmin yangi admin qo'sha oladi",
        });
    }

    const newAdmin = await createAdmin(userId, firstName, req.user.userId, {
      lastName,
      username,
      role,
      permissions,
    });
    res.json({
      success: true,
      message: "Admin muvaffaqiyatli qo'shildi",
      data: newAdmin,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/admins/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const currentAdmin = await getAdmin(req.user.userId);
    if (!currentAdmin || currentAdmin.role !== "superadmin") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Faqat superadmin admin ma'lumotlarini tahrirlashi mumkin",
        });
    }

    const updatedAdmin = await updateAdmin(id, updateData);

    if (!updatedAdmin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin topilmadi" });
    }

    res.json({
      success: true,
      message: "Admin muvaffaqiyatli yangilandi",
      data: updatedAdmin,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/admins/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const currentAdmin = await getAdmin(req.user.userId);
    if (!currentAdmin || currentAdmin.role !== "superadmin") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Faqat superadmin adminni o'chira oladi",
        });
    }

    if (req.user.userId === parseInt(id)) {
      return res
        .status(400)
        .json({ success: false, message: "O'zingizni o'chira olmaysiz" });
    }

    const deletedAdmin = await deleteAdmin(id);

    if (!deletedAdmin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin topilmadi" });
    }

    res.json({ success: true, message: "Admin muvaffaqiyatli o'chirildi" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/admins/check/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const admin = await getAdmin(userId);
    res.json({ success: true, isAdmin: !!admin, data: admin || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Settings API
app.get("/api/settings/:key", authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const value = await getSetting(key);
    res.json({ success: true, value: value });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/settings", authenticateToken, async (req, res) => {
  try {
    const { key, value, description } = req.body;

    if (!key) {
      return res
        .status(400)
        .json({ success: false, message: "Key talab qilinadi" });
    }

    const setting = await setSetting(key, value, description);
    res.json({ success: true, message: "Sozlama saqlandi", data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start API server
app.listen(ADMIN_PORT, () => {
  console.log(`🌐 Admin API: http://localhost:${ADMIN_PORT}`);
});

async function sendWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1));
    }
  }
}

// Middleware: Bloklangan userni tekshirish
bot.use(async (ctx, next) => {
  // Admin bo'lsa bloklashni tekshirmaydi
  if (ctx.from && isAdmin(ctx.from.id)) {
    return next();
  }

  // Faqat oddiy userlar uchun tekshirish
  if (ctx.from && !isAdmin(ctx.from.id)) {
    const user = await getUser(ctx.from.id);

    if (user && user.is_block) {
      // Agar bloklangan bo'lsa
      if (ctx.callbackQuery) {
        await ctx.answerCbQuery("🚫 Sizning akkauntingiz bloklangan!");
      } else {
        await ctx.reply(
          "<b>🚫 Sizning akkauntingiz bloklangan!\n\n" +
            "Agar bu xato deb hisoblasangiz, admin bilan bog'laning.</b>",
          { parse_mode: "HTML" }
        );
      }
      return; // Keyingi handlerga o'tkazmaymiz
    }
  }

  return next();
});

// ============ KEYBOARDS ============

const keyboardMain = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "📖 Tabrik Yuborish", callback_data: "sendCongrats" }],
      [{ text: "🎨 Rasmli tabriknoma yasash", callback_data: "certificate" }],
      [
        { text: "🤖 Bot haqida", callback_data: "botHaqida" },
        { text: "🎄 Yangi Yilga", callback_data: "newYearCountdown" },
      ],
    ],
  },
};

const keyboardAdmin = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: "📊 Statistika", callback_data: "adminStats" },
        { text: "📝 Tabriklar", callback_data: "adminPending" },
      ],
      [
        { text: "📢 Xabar yuborish", callback_data: "adminBroadcast" },
        { text: "📺 Kanallar", callback_data: "adminChannels" },
      ],
      [
        {
          text: "🎨 Rasmli tabriknoma yasash",
          callback_data: "adminCertificates",
        },
        { text: "⚙️ Sozlamalar", callback_data: "adminSettings" },
      ],
      [{ text: "🔙 Bosh menyu", callback_data: "restartBot" }],
    ],
  },
};

const keyboardRestart = {
  reply_markup: {
    inline_keyboard: [[{ text: "🔄 Qaytish", callback_data: "restartBot" }]],
  },
};

// ============ SCENES ============

// Tabrik scene
const tabrikScene = new Scenes.BaseScene("tabrikScene");
tabrikScene.enter(async (ctx) => {
  await ctx.reply(
    "<b>📝 Tabrik xabaringizni yuboring:\n\n" +
      "• Matn, rasm yoki video\n" +
      "• Iltimos odobli yozing\n" +
      "• 18+ kontent man etilgan</b>",
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "❌ Bekor qilish", callback_data: "cancelScene" }],
        ],
      },
    }
  );
});

tabrikScene.on("text", async (ctx) => {
  try {
    const message = ctx.message.text;
    await ctx.deleteMessage();

    ctx.session.congratsData = {
      userId: ctx.from.id,
      firstName: ctx.from.first_name,
      username: ctx.from.username,
      messageType: "text",
      message,
    };

    await ctx.reply(
      `<b>📝 Sizning xabaringiz:</b>\n\n${message}\n\n<b>⚠️ Tasdiqlaysizmi?</b>`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "✅ Tasdiqlash", callback_data: "userApprove" }],
            [{ text: "🔄 Qayta", callback_data: "restarted" }],
            [{ text: "❌ Bekor qilish", callback_data: "cancelScene" }],
          ],
        },
      }
    );
  } catch (error) {
    console.error("Text xatolik:", error);
  }
});

tabrikScene.on("photo", async (ctx) => {
  try {
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const caption = ctx.message.caption || "";
    await ctx.deleteMessage();

    ctx.session.congratsData = {
      userId: ctx.from.id,
      firstName: ctx.from.first_name,
      username: ctx.from.username,
      messageType: "photo",
      fileId: photo.file_id,
      caption,
    };

    await ctx.telegram.sendPhoto(ctx.from.id, photo.file_id, {
      caption: (caption || "") + "\n\n<b>⚠️ Tasdiqlaysizmi?</b>",
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ Ha", callback_data: "userApprove" }],
          [{ text: "🔄 Qayta", callback_data: "restarted" }],
          [{ text: "❌ Yo'q", callback_data: "cancelScene" }],
        ],
      },
    });
  } catch (error) {
    console.error("Photo xatolik:", error);
  }
});

tabrikScene.on("video", async (ctx) => {
  try {
    const video = ctx.message.video;
    const caption = ctx.message.caption || "";
    await ctx.deleteMessage();

    ctx.session.congratsData = {
      userId: ctx.from.id,
      firstName: ctx.from.first_name,
      username: ctx.from.username,
      messageType: "video",
      fileId: video.file_id,
      caption,
    };

    await ctx.telegram.sendVideo(ctx.from.id, video.file_id, {
      caption: (caption || "") + "\n\n<b>⚠️ Tasdiqlaysizmi?</b>",
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ Ha", callback_data: "userApprove" }],
          [{ text: "🔄 Qayta", callback_data: "restarted" }],
          [{ text: "❌ Yo'q", callback_data: "cancelScene" }],
        ],
      },
    });
  } catch (error) {
    console.error("Video xatolik:", error);
  }
});

tabrikScene.action("cancelScene", async (ctx) => {
  await ctx.deleteMessage();
  await ctx.reply("❌ Bekor qilindi", { ...keyboardMain });
  await ctx.scene.leave();
});

tabrikScene.action("restarted", async (ctx) => {
  await ctx.editMessageText("<b>📝 Yangi xabar yuboring</b>", {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "❌ Bekor qilish", callback_data: "cancelScene" }],
      ],
    },
  });
});

tabrikScene.action("userApprove", async (ctx) => {
  try {
    const data = ctx.session.congratsData;
    if (!data) {
      await ctx.answerCbQuery("❌ Ma'lumot topilmadi");
      return;
    }

    const saved = await createCongrats({ ...data, userApproved: true });

    await ctx.editMessageText(
      "<b>✅ Xabaringiz tasdiqlandi!\n\n🔄 Admin ko'rib chiqmoqda...</b>",
      { parse_mode: "HTML", ...keyboardRestart }
    );

    // Admin guruhiga yuborish
    const adminGroupId = process.env.ADMIN_GROUP_ID;
    const adminMsg =
      `<b>🆕 YANGI TABRIK\n\n` +
      `👤 ${data.firstName}\n` +
      `🆔 <code>${data.userId}</code>\n` +
      `📱 @${data.username || "yo'q"}\n` +
      `🔑 ID: <code>${saved._id}</code></b>`;

    const inlineButtons = {
      inline_keyboard: [
        [
          {
            text: "✅ Tasdiqlash",
            callback_data: `adminApprove_${saved._id}`,
          },
          {
            text: "❌ Rad etish",
            callback_data: `adminReject_${saved._id}`,
          },
        ],
      ],
    };

    // Admin guruhiga yuborish
    if (adminGroupId) {
      if (data.messageType === "text") {
        await bot.telegram.sendMessage(
          adminGroupId,
          adminMsg + `\n\n💬 ${data.message}`,
          {
            parse_mode: "HTML",
            reply_markup: inlineButtons,
          }
        );
      } else if (data.messageType === "photo") {
        await bot.telegram.sendPhoto(adminGroupId, data.fileId, {
          caption: adminMsg + (data.caption ? `\n\n📝 ${data.caption}` : ""),
          parse_mode: "HTML",
          reply_markup: inlineButtons,
        });
      } else if (data.messageType === "video") {
        await bot.telegram.sendVideo(adminGroupId, data.fileId, {
          caption: adminMsg + (data.caption ? `\n\n📝 ${data.caption}` : ""),
          parse_mode: "HTML",
          reply_markup: inlineButtons,
        });
      }
    }

    // Admin shaxsiga ham yuborish (eski kod)
    if (data.messageType === "text") {
      await bot.telegram.sendMessage(
        adminId,
        adminMsg + `\n\n💬 ${data.message}`,
        {
          parse_mode: "HTML",
          reply_markup: inlineButtons,
        }
      );
    } else if (data.messageType === "photo") {
      await bot.telegram.sendPhoto(adminId, data.fileId, {
        caption: adminMsg + (data.caption ? `\n\n📝 ${data.caption}` : ""),
        parse_mode: "HTML",
        reply_markup: inlineButtons,
      });
    } else if (data.messageType === "video") {
      await bot.telegram.sendVideo(adminId, data.fileId, {
        caption: adminMsg + (data.caption ? `\n\n📝 ${data.caption}` : ""),
        parse_mode: "HTML",
        reply_markup: inlineButtons,
      });
    }

    ctx.session.congratsData = null;
    await ctx.scene.leave();
  } catch (error) {
    console.error("User tasdiqlash xatolik:", error);
    await ctx.answerCbQuery("❌ Xatolik!");
  }
});

// Broadcast scene
const broadcastScene = new Scenes.BaseScene("broadcastScene");
broadcastScene.enter(async (ctx) => {
  await ctx.reply(
    "<b>📢 XABAR YUBORISH\n\n" +
      "Barcha foydalanuvchilarga yuboriladi.\n" +
      "Xabaringizni yuboring (matn, rasm yoki video):</b>",
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "❌ Bekor qilish", callback_data: "cancelBroadcast" }],
        ],
      },
    }
  );
});

broadcastScene.on("text", async (ctx) => {
  try {
    const message = ctx.message.text;
    ctx.session.broadcastData = {
      message,
      messageType: "text",
    };

    await ctx.reply(
      `<b>📝 Xabar:</b>\n\n${message}\n\n<b>⚠️ Tasdiqlaysizmi?</b>`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "✅ Yuborish", callback_data: "startBroadcast" }],
            [{ text: "❌ Bekor qilish", callback_data: "cancelBroadcast" }],
          ],
        },
      }
    );
  } catch (error) {
    console.error("Broadcast text xatolik:", error);
  }
});

broadcastScene.on("photo", async (ctx) => {
  try {
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const caption = ctx.message.caption || "";

    ctx.session.broadcastData = {
      message: caption,
      messageType: "photo",
      fileId: photo.file_id,
    };

    await ctx.telegram.sendPhoto(ctx.from.id, photo.file_id, {
      caption: (caption || "Rasm") + "\n\n<b>⚠️ Yuborilsinmi?</b>",
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ Ha", callback_data: "startBroadcast" }],
          [{ text: "❌ Yo'q", callback_data: "cancelBroadcast" }],
        ],
      },
    });
  } catch (error) {
    console.error("Broadcast photo xatolik:", error);
  }
});

broadcastScene.on("video", async (ctx) => {
  try {
    const video = ctx.message.video;
    const caption = ctx.message.caption || "";

    ctx.session.broadcastData = {
      message: caption,
      messageType: "video",
      fileId: video.file_id,
    };

    await ctx.telegram.sendVideo(ctx.from.id, video.file_id, {
      caption: (caption || "Video") + "\n\n<b>⚠️ Yuborilsinmi?</b>",
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ Ha", callback_data: "startBroadcast" }],
          [{ text: "❌ Yo'q", callback_data: "cancelBroadcast" }],
        ],
      },
    });
  } catch (error) {
    console.error("Broadcast video xatolik:", error);
  }
});

broadcastScene.action("startBroadcast", async (ctx) => {
  try {
    const data = ctx.session.broadcastData;
    if (!data) {
      await ctx.answerCbQuery("❌ Ma'lumot topilmadi");
      return;
    }

    const users = await getAllUsers();
    const totalUsers = users.length;

    await ctx.editMessageText(
      `<b>📊 Yuborilmoqda...\n\n` +
        `Jami: ${totalUsers} ta foydalanuvchi\n` +
        `Kutish: 0%</b>`,
      { parse_mode: "HTML" }
    );

    const broadcast = await createBroadcast({
      message: data.message || "Xabar",
      messageType: data.messageType,
      fileId: data.fileId,
      totalUsers,
      status: "processing",
    });

    let successCount = 0;
    let failureCount = 0;
    let sentCount = 0;

    // Batch yuborish
    for (let i = 0; i < users.length; i += TELEGRAM_RATE_LIMIT) {
      const batch = users.slice(i, i + TELEGRAM_RATE_LIMIT);

      await Promise.allSettled(
        batch.map(async (user) => {
          try {
            if (data.messageType === "text") {
              await bot.telegram.sendMessage(user.userId, data.message);
            } else if (data.messageType === "photo") {
              await bot.telegram.sendPhoto(user.userId, data.fileId, {
                caption: data.message,
              });
            } else if (data.messageType === "video") {
              await bot.telegram.sendVideo(user.userId, data.fileId, {
                caption: data.message,
              });
            }
            successCount++;
          } catch (error) {
            failureCount++;
            console.error(`Yuborilmadi ${user.userId}:`, error.message);
          }
        })
      );

      sentCount = i + batch.length;
      const percent = Math.round((sentCount / totalUsers) * 100);

      // Har 30 ta xabardan keyin progress yangilash
      if (sentCount % 30 === 0 || sentCount === totalUsers) {
        try {
          await ctx.editMessageText(
            `<b>📊 Yuborilmoqda...\n\n` +
              `✅ Yuborildi: ${successCount}\n` +
              `❌ Xatolik: ${failureCount}\n` +
              `📈 Jami: ${sentCount}/${totalUsers}\n` +
              `⏳ ${percent}%</b>`,
            { parse_mode: "HTML" }
          );
        } catch (e) {
          // Edit xatoligi ignore
        }
      }

      // Rate limit uchun kutish
      if (i + TELEGRAM_RATE_LIMIT < users.length) {
        await sleep(BATCH_DELAY);
      }
    }

    await updateBroadcast(broadcast._id, {
      successCount,
      failureCount,
      status: "completed",
      completedAt: getTashkentTime().toDate(),
    });

    await ctx.editMessageText(
      `<b>✅ XABAR YUBORILDI!\n\n` +
        `✅ Muvaffaqiyatli: ${successCount}\n` +
        `❌ Xatolik: ${failureCount}\n` +
        `📊 Jami: ${totalUsers}</b>`,
      { parse_mode: "HTML", ...keyboardAdmin }
    );

    ctx.session.broadcastData = null;
    await ctx.scene.leave();
  } catch (error) {
    console.error("Broadcast yuborish xatolik:", error);
    await ctx.reply("❌ Xatolik yuz berdi!", keyboardAdmin);
    await ctx.scene.leave();
  }
});

broadcastScene.action("cancelBroadcast", async (ctx) => {
  await ctx.deleteMessage();
  await ctx.reply("❌ Bekor qilindi", { ...keyboardAdmin });
  await ctx.scene.leave();
});

// Kanal qo'shish scene
const addChannelScene = new Scenes.BaseScene("addChannelScene");
addChannelScene.enter(async (ctx) => {
  await ctx.reply(
    "<b>📺 KANAL QO'SHISH\n\n" +
      "Kanal ma'lumotlarini quyidagi formatda yuboring:\n\n" +
      "<code>-1001234567890\nkanalusername\nKanal nomi</code>\n\n" +
      "1-qator: Channel ID\n" +
      "2-qator: Username (@ siz)\n" +
      "3-qator: Kanal nomi</b>",
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "❌ Bekor qilish", callback_data: "cancelAddChannel" }],
        ],
      },
    }
  );
});

addChannelScene.on("text", async (ctx) => {
  try {
    const lines = ctx.message.text.split("\n");
    if (lines.length < 3) {
      await ctx.reply("❌ Noto'g'ri format! Qayta urinib ko'ring.");
      return;
    }

    const channelId = lines[0].trim();
    const username = lines[1].trim();
    const name = lines[2].trim();

    // Kanal mavjudligini tekshirish
    const existing = await getChannel(channelId);
    if (existing) {
      await ctx.reply("❌ Bu kanal allaqachon mavjud!");
      return;
    }

    const channels = await getAllChannels();
    await createChannel({
      channelId,
      channelUsername: username,
      channelName: name,
      isRequired: true,
      order: channels.length + 1,
    });

    await ctx.reply(
      `<b>✅ KANAL QO'SHILDI!\n\n` +
        `📺 ${name}\n` +
        `🆔 <code>${channelId}</code>\n` +
        `📱 @${username}</b>`,
      { parse_mode: "HTML", ...keyboardAdmin }
    );

    await ctx.scene.leave();
  } catch (error) {
    console.error("Kanal qo'shish xatolik:", error);
    await ctx.reply("❌ Xatolik yuz berdi!", keyboardAdmin);
    await ctx.scene.leave();
  }
});

addChannelScene.action("cancelAddChannel", async (ctx) => {
  await ctx.deleteMessage();
  await ctx.reply("❌ Bekor qilindi", { ...keyboardAdmin });
  await ctx.scene.leave();
});

// Sertifikat qo'shish scene
const addCertificateScene = new Scenes.BaseScene("addCertificateScene");
addCertificateScene.enter(async (ctx) => {
  await ctx.reply(
    "<b>🎨 SERTIFIKAT QO'SHISH\n\n" +
      "Ma'lumotlarni quyidagi formatda yuboring:\n\n" +
      "<code>1\n1920\n1080\nYangi yil\n</code>\n" +
      "1-qator: Template raqami\n" +
      "2-qator: Kenglik (px)\n" +
      "3-qator: Balandlik (px)\n" +
      "4-qator: Nomi</b>",
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "❌ Bekor qilish", callback_data: "cancelAddCert" }],
        ],
      },
    }
  );
});

addCertificateScene.on("text", async (ctx) => {
  try {
    const lines = ctx.message.text.split("\n");
    if (lines.length < 4) {
      await ctx.reply("❌ Noto'g'ri format!");
      return;
    }

    const templateNumber = parseInt(lines[0].trim());
    const width = parseInt(lines[1].trim());
    const height = parseInt(lines[2].trim());
    const name = lines[3].trim();

    const existing = await getCertificate(templateNumber);
    if (existing) {
      await ctx.reply("❌ Bu template raqami mavjud!");
      return;
    }

    await createCertificate({
      templateNumber,
      width,
      height,
      name,
    });

    await ctx.reply(
      `<b>✅ SERTIFIKAT QO'SHILDI!\n\n` +
        `🎨 ${name}\n` +
        `🔢 Template: ${templateNumber}\n` +
        `📐 O'lcham: ${width}x${height}</b>`,
      { parse_mode: "HTML", ...keyboardAdmin }
    );

    await ctx.scene.leave();
  } catch (error) {
    console.error("Sertifikat qo'shish xatolik:", error);
    await ctx.reply("❌ Xatolik!", keyboardAdmin);
    await ctx.scene.leave();
  }
});

addCertificateScene.action("cancelAddCert", async (ctx) => {
  await ctx.deleteMessage();
  await ctx.reply("❌ Bekor qilindi", { ...keyboardAdmin });
  await ctx.scene.leave();
});

// Sertifikat yaratish scene (foydalanuvchilar uchun)
const createCertificateScene = new Scenes.BaseScene("createCertificateScene");
createCertificateScene.enter(async (ctx) => {
  try {
    const certificates = await getAllCertificates();
    if (certificates.length === 0) {
      await ctx.reply(
        "<b>📭 Hozircha rasmli tabriklar qo'shilmagan\n\n" +
          "Iltimos, keyinroq qaytib ko'ring.</b>",
        { parse_mode: "HTML", ...keyboardRestart }
      );
      await ctx.scene.leave();
      return;
    }

    const buttons = certificates.map((cert) => [
      {
        text: `${cert.templateNumber}. ${cert.name} (${cert.width}x${cert.height})`,
        callback_data: `selectCert_${cert.templateNumber}`,
      },
    ]);

    buttons.push([
      { text: "❌ Bekor qilish", callback_data: "cancelCertCreate" },
    ]);

    await ctx.reply(
      "<b>🎨 SERTIFIKAT YARATISH\n\n" + "Sertifikat turini tanlang:</b>",
      {
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: buttons },
      }
    );
  } catch (error) {
    console.error("Sertifikat scene xatolik:", error);
    await ctx.reply("❌ Xatolik", keyboardRestart);
    await ctx.scene.leave();
  }
});

createCertificateScene.action(/selectCert_(\d+)/, async (ctx) => {
  const templateNumber = parseInt(ctx.match[1]);
  ctx.session.selectedCertTemplate = templateNumber;

  await ctx.editMessageText(
    "<b>📝 Matn kiriting:\n\n" + "Sertifikatda ko'rsatiladigan matn</b>",
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "❌ Bekor qilish", callback_data: "cancelCertCreate" }],
        ],
      },
    }
  );
});

createCertificateScene.on("text", async (ctx) => {
  try {
    const templateNumber = ctx.session.selectedCertTemplate;
    if (!templateNumber) {
      await ctx.reply("❌ Iltimos, avval template tanlang");
      return;
    }

    const text = ctx.message.text;

    // Get certificate template from database
    const template = await getCertificate(templateNumber);
    if (!template) {
      await ctx.reply("❌ Template topilmadi", keyboardRestart);
      await ctx.scene.leave();
      return;
    }

    // Generate certificate using our system
    const path = require("path");
    const fs = require("fs");
    const { generateCertificate } = require("./modules/imageProcessor");

    const outputFilename = `cert_${Date.now()}_${ctx.from.id}.png`;
    const outputPath = path.join(
      __dirname,
      "uploads",
      "generated",
      outputFilename
    );

    const result = await generateCertificate({
      imagePath: template.imagePath,
      text: text,
      textConfig: template.textConfig,
      outputPath: outputPath,
    });

    if (result.success) {
      await ctx.replyWithPhoto(
        { source: outputPath },
        {
          caption: "<b>✅ Sertifikat tayyor!</b>",
          parse_mode: "HTML",
          ...keyboardRestart,
        }
      );

      // Delete file after sending
      setTimeout(() => {
        try {
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
          }
        } catch (err) {
          console.error("File delete error:", err);
        }
      }, 5000);
    } else {
      throw new Error(result.error);
    }

    ctx.session.selectedCertTemplate = null;
    await ctx.scene.leave();
  } catch (error) {
    console.error("Sertifikat yaratish xatolik:", error);
    await ctx.reply(
      "❌ Sertifikat yaratilmadi. Qayta urinib ko'ring.",
      keyboardRestart
    );
    await ctx.scene.leave();
  }
});

createCertificateScene.action("cancelCertCreate", async (ctx) => {
  await ctx.deleteMessage();
  await ctx.reply("❌ Bekor qilindi", { ...keyboardMain });
  ctx.session.selectedCertTemplate = null;
  await ctx.scene.leave();
});

// Stage
const stage = new Scenes.Stage([
  tabrikScene,
  broadcastScene,
  addChannelScene,
  addCertificateScene,
  createCertificateScene,
]);

bot.use(session());
bot.use(stage.middleware());

// ============ BOT HANDLERS ============

bot.command("start", async (ctx) => {
  try {
    ctx.scene.leave();

    const userId = ctx.from.id;
    const firstName = ctx.from.first_name;
    const username = ctx.from.username;

    // User yaratish/yangilash
    let user = await getUser(userId);
    if (!user) {
      user = await createUser(userId, firstName, username);

      // Send notification to admin group instead of admin user
      if (adminGroupId) {
        const userCount = await getUsersCount();
        try {
          await bot.telegram.sendMessage(
            adminGroupId,
            `🆕 <b>Yangi foydalanuvchi [${userCount}]</b>\n\n` +
              `👤 <b>Ism:</b> ${firstName}\n` +
              `🆔 <b>ID:</b> <code>${userId}</code>\n` +
              `📱 <b>Username:</b> @${username || "yo'q"}\n` +
              `📅 <b>Sana:</b> ${getTashkentTime().format("DD.MM.YYYY HH:mm")}`,
            { parse_mode: "HTML" }
          );
        } catch (error) {
          console.error(
            "Admin guruhiga xabar yuborishda xatolik:",
            error.message
          );
        }
      }
    }

    // Bloklangan userni tekshirish
    if (user && user.is_block) {
      await ctx.reply(
        "<b>🚫 Sizning akkauntingiz bloklangan!\n\n" +
          "Agar bu xato deb hisoblasangiz, admin bilan bog'laning.</b>",
        { parse_mode: "HTML" }
      );
      return;
    }

    // Kanallarni tekshirish
    const channels = await getRequiredChannels();
    let isMember = true;

    for (const channel of channels) {
      try {
        const member = await ctx.telegram.getChatMember(
          channel.channelId,
          userId
        );
        if (!["member", "administrator", "creator"].includes(member.status)) {
          isMember = false;
          break;
        }
      } catch (error) {
        console.error(
          `Kanal tekshirish xatolik ${channel.channelId}:`,
          error.message
        );
        isMember = false;
        break;
      }
    }

    if (!isMember) {
      const channelButtons = channels.map((ch) => [
        {
          text: `${ch.channelIcon || "📢"} ${ch.channelName}`,
          url: `https://t.me/${ch.channelUsername}`,
        },
      ]);

      channelButtons.push([
        { text: "✅ Tekshirish", callback_data: "checkMembership" },
      ]);

      await ctx.reply(
        `<b>Assalomu Alaykum! 👋\n\n` +
          `Botdan foydalanish uchun kanallarga a'zo bo'ling:</b>`,
        {
          parse_mode: "HTML",
          reply_markup: { inline_keyboard: channelButtons },
        }
      );
    } else {
      await ctx.reply(
        `<b>Assalomu Alaykum, ${firstName}! 👋\n\n` +
          `🎉 Bayramona Tabriklar botiga xush kelibsiz!</b>`,
        { parse_mode: "HTML", ...keyboardMain }
      );
    }
  } catch (error) {
    console.error("Start xatolik:", error);
    await ctx.reply("❌ Xatolik. Qayta /start bosing.");
  }
});

bot.command("admin", async (ctx) => {
  try {
    ctx.scene.leave();

    if (!isAdmin(ctx.from.id)) {
      await ctx.reply("❌ Bu admin buyrug'i!");
      return;
    }

    const userCount = await getUsersCount();
    const approvedCount = await getApprovedCongratsCount();
    const pendingCount = await getPendingCongratsCount();

    await ctx.reply(
      `<b>🔐 ADMIN PANEL\n\n` +
        `👥 Foydalanuvchilar: ${userCount}\n` +
        `✅ Tasdiqlangan: ${approvedCount}\n` +
        `⏳ Kutilmoqda: ${pendingCount}</b>`,
      { parse_mode: "HTML", ...keyboardAdmin }
    );
  } catch (error) {
    console.error("Admin xatolik:", error);
    await ctx.reply("❌ Xatolik");
  }
});

// New Year Countdown Command
bot.command("newyear", async (ctx) => {
  try {
    const now = getTashkentTime();
    const currentYear = now.year();
    const nextYear = currentYear + 1;

    // Next New Year at midnight Tashkent time
    const newYear = moment.tz(`${nextYear}-01-01 00:00:00`, TIMEZONE);

    const duration = moment.duration(newYear.diff(now));

    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    let message = `🎄 <b>${nextYear} Yangi Yilga:</b>\n\n`;
    message += `📅 <b>${days}</b> kun\n`;
    message += `⏰ <b>${hours}</b> soat\n`;
    message += `⏱ <b>${minutes}</b> daqiqa\n`;
    message += `⏲ <b>${seconds}</b> soniya\n\n`;
    message += `🕐 Toshkent vaqti: ${now.format("HH:mm:ss DD.MM.YYYY")}\n`;
    message += `🎉 Yangi Yil: ${newYear.format("HH:mm:ss DD.MM.YYYY")}`;

    await ctx.reply(message, { parse_mode: "HTML" });
  } catch (error) {
    console.error("New Year countdown error:", error);
    await ctx.reply("❌ Xatolik yuz berdi");
  }
});

// Actions
bot.action("checkMembership", async (ctx) => {
  try {
    const userId = ctx.from.id;
    const channels = await getRequiredChannels();
    let isMember = true;

    for (const channel of channels) {
      try {
        const member = await ctx.telegram.getChatMember(
          channel.channelId,
          userId
        );
        if (!["member", "administrator", "creator"].includes(member.status)) {
          isMember = false;
          break;
        }
      } catch (error) {
        isMember = false;
        break;
      }
    }

    if (isMember) {
      await ctx.editMessageText(
        "<b>✅ A'zolik tasdiqlandi!\n\nBotdan foydalanishingiz mumkin</b>",
        { parse_mode: "HTML", ...keyboardMain }
      );
    } else {
      await ctx.answerCbQuery("❌ Iltimos, barcha kanallarga a'zo bo'ling!", {
        show_alert: true,
      });
    }
  } catch (error) {
    console.error("Membership check xatolik:", error);
    await ctx.answerCbQuery("❌ Xatolik!");
  }
});

bot.action("sendCongrats", async (ctx) => {
  await ctx.scene.enter("tabrikScene");
});

bot.action("certificate", async (ctx) => {
  await ctx.scene.enter("createCertificateScene");
});

bot.action("newYearCountdown", async (ctx) => {
  try {
    const now = getTashkentTime();
    const currentYear = now.year();
    const nextYear = currentYear + 1;

    const newYear = moment.tz(`${nextYear}-01-01 00:00:00`, TIMEZONE);
    const duration = moment.duration(newYear.diff(now));

    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    let message = `🎄 <b>${nextYear} Yangi Yilga:</b>\n\n`;
    message += `📅 <b>${days}</b> kun\n`;
    message += `⏰ <b>${hours}</b> soat\n`;
    message += `⏱ <b>${minutes}</b> daqiqa\n`;
    message += `⏲ <b>${seconds}</b> soniya\n\n`;
    message += `🕐 Toshkent vaqti: ${now.format("HH:mm:ss DD.MM.YYYY")}\n`;
    message += `🎉 Yangi Yil: ${newYear.format("HH:mm:ss DD.MM.YYYY")}`;

    await ctx.editMessageText(message, {
      parse_mode: "HTML",
      ...keyboardRestart,
    });
  } catch (error) {
    console.error("New Year countdown error:", error);
    await ctx.reply("❌ Xatolik yuz berdi");
  }
});

bot.action("botHaqida", async (ctx) => {
  try {
    // Get bot about text from settings
    const botAboutText =
      (await getSetting("bot_about")) ||
      `👨‍💻 Dasturchi: @${adminUser}\n📖 Bot maqsadi: Bayramona tabriklar yuborish`;

    await ctx.editMessageText(`<b>🤖 BOT HAQIDA\n\n${botAboutText}</b>`, {
      parse_mode: "HTML",
      ...keyboardRestart,
    });
  } catch (error) {
    console.error("Bot haqida error:", error);
    await ctx.reply("❌ Xatolik yuz berdi");
  }
});

bot.action("restartBot", async (ctx) => {
  ctx.scene.leave();
  await ctx.editMessageText("<b>🏠 BOSH MENYU</b>", {
    parse_mode: "HTML",
    ...keyboardMain,
  });
});

// Admin actions
bot.action("adminStats", async (ctx) => {
  try {
    if (!isAdmin(ctx.from.id)) return;

    const userCount = await getUsersCount();
    const approvedCount = await getApprovedCongratsCount();
    const pendingCount = await getPendingCongratsCount();
    const broadcastStats = await getBroadcastStats();
    const channels = await getAllChannels();

    await ctx.editMessageText(
      `<b>📊 STATISTIKA\n\n` +
        `👥 Foydalanuvchilar: ${userCount}\n` +
        `✅ Tasdiqlangan tabriklar: ${approvedCount}\n` +
        `⏳ Kutilayotgan: ${pendingCount}\n` +
        `📢 Xabarlar yuborilgan: ${broadcastStats.total}\n` +
        `📺 Kanallar: ${channels.length}</b>`,
      { parse_mode: "HTML", ...keyboardAdmin }
    );
  } catch (error) {
    console.error("Stats xatolik:", error);
  }
});

bot.action("adminPending", async (ctx) => {
  try {
    if (!isAdmin(ctx.from.id)) return;

    const pending = await getPendingCongratsForAdmin();

    if (pending.length === 0) {
      await ctx.answerCbQuery("✅ Kutilayotgan tabriklar yo'q!", {
        show_alert: true,
      });
      return;
    }

    await ctx.editMessageText(
      `<b>⏳ KUTILAYOTGAN TABRIKLAR\n\n` +
        `Jami: ${pending.length} ta\n\n` +
        `Birinchisini ko'rish uchun tugmani bosing</b>`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "👁 Ko'rish",
                callback_data: `viewPending_${pending[0]._id}`,
              },
            ],
            [{ text: "🔙 Ortga", callback_data: "adminMenu" }],
          ],
        },
      }
    );
  } catch (error) {
    console.error("Pending xatolik:", error);
  }
});

bot.action(/viewPending_(.+)/, async (ctx) => {
  try {
    if (!isAdmin(ctx.from.id)) return;

    const congratsId = ctx.match[1];
    const congrats = await getCongrats(congratsId);

    if (!congrats) {
      await ctx.answerCbQuery("❌ Topilmadi!");
      return;
    }

    const msg =
      `<b>🆔 <code>${congratsId}</code>\n\n` +
      `👤 ${congrats.firstName}\n` +
      `🆔 <code>${congrats.userId}</code>\n` +
      `📱 @${congrats.username || "yo'q"}</b>`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "✅ Tasdiqlash",
            callback_data: `adminApprove_${congratsId}`,
          },
        ],
        [{ text: "❌ Rad etish", callback_data: `adminReject_${congratsId}` }],
        [{ text: "🔙 Ortga", callback_data: "adminPending" }],
      ],
    };

    if (congrats.messageType === "text") {
      await ctx.editMessageText(msg + `\n\n💬 ${congrats.message}`, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      });
    } else if (congrats.messageType === "photo") {
      await ctx.deleteMessage();
      await ctx.telegram.sendPhoto(adminId, congrats.fileId, {
        caption: msg + (congrats.caption ? `\n\n📝 ${congrats.caption}` : ""),
        parse_mode: "HTML",
        reply_markup: keyboard,
      });
    } else if (congrats.messageType === "video") {
      await ctx.deleteMessage();
      await ctx.telegram.sendVideo(adminId, congrats.fileId, {
        caption: msg + (congrats.caption ? `\n\n📝 ${congrats.caption}` : ""),
        parse_mode: "HTML",
        reply_markup: keyboard,
      });
    }
  } catch (error) {
    console.error("View pending xatolik:", error);
  }
});

bot.action(/adminApprove_(.+)/, async (ctx) => {
  try {
    // Admin yoki admin guruhidan kelganmi tekshirish
    const adminGroupId = process.env.ADMIN_GROUP_ID;
    const isFromAdminGroup = ctx.chat?.id?.toString() === adminGroupId;

    if (!isAdmin(ctx.from.id) && !isFromAdminGroup) {
      await ctx.answerCbQuery("❌ Ruxsat yo'q!");
      return;
    }

    // Faqat adminlar tasdiqlashi mumkin
    if (!isAdmin(ctx.from.id)) {
      await ctx.answerCbQuery("❌ Faqat adminlar tasdiqlashi mumkin!");
      return;
    }

    const congratsId = ctx.match[1];
    const congrats = await getCongrats(congratsId);

    if (!congrats) {
      await ctx.answerCbQuery("❌ Topilmadi!");
      return;
    }

    await updateCongrats(congratsId, {
      adminApproved: true,
      publishedToChannel: true,
      publishedAt: getTashkentTime().toDate(),
    });

    // Kanalga yuborish - Settings'dan publish_channel_id olish
    let publishChannelId = await getSetting("publish_channel_id");

    // Agar sozlamada yo'q bo'lsa, birinchi kanalni olish
    if (!publishChannelId) {
      const channels = await getAllChannels();
      const activeChannels = channels.filter((ch) => ch.isActive);
      if (activeChannels.length > 0) {
        publishChannelId = activeChannels[0].channelId;
      }
    }

    if (publishChannelId) {
      const footer = `\n\n📖 @${botUser} orqali tabrik yuboring!`;

      if (congrats.messageType === "text") {
        await bot.telegram.sendMessage(
          publishChannelId,
          (congrats.message || "") + footer
        );
      } else if (congrats.messageType === "photo") {
        await bot.telegram.sendPhoto(publishChannelId, congrats.fileId, {
          caption: (congrats.caption || "") + footer,
        });
      } else if (congrats.messageType === "video") {
        await bot.telegram.sendVideo(publishChannelId, congrats.fileId, {
          caption: (congrats.caption || "") + footer,
        });
      }
    }

    // Userga xabar
    // Get channel link
    let channelLink = "";
    if (channel && channel.channelUsername) {
      channelLink = `\n\n📢 <a href="https://t.me/${channel.channelUsername}">Tabrikingizni ko'rish</a>`;
    }

    await bot.telegram.sendMessage(
      congrats.userId,
      `<b>✅ Tabrikingiz tasdiqlandi va kanalga joylandi!${channelLink}</b>`,
      { parse_mode: "HTML", ...keyboardMain, disable_web_page_preview: false }
    );

    await ctx.editMessageText(
      `<b>✅ Tabrik tasdiqlandi!\n\n` +
        `👤 ${congrats.firstName} (@${congrats.username || "yo'q"})\n` +
        `👨‍💼 Tasdiqlagan: @${ctx.from.username || ctx.from.first_name}</b>`,
      { parse_mode: "HTML" }
    );

    try {
      await ctx.answerCbQuery("✅ Tasdiqlandi!");
    } catch (cbError) {
      // Ignore callback query timeout errors
      console.log("Callback query timeout (ignore):", cbError.message);
    }
  } catch (error) {
    console.error("Admin approve xatolik:", error);
    try {
      await ctx.answerCbQuery("❌ Xatolik!");
    } catch (cbError) {
      // Ignore callback query timeout errors
    }
  }
});

bot.action(/adminReject_(.+)/, async (ctx) => {
  try {
    // Admin yoki admin guruhidan kelganmi tekshirish
    const adminGroupId = process.env.ADMIN_GROUP_ID;
    const isFromAdminGroup = ctx.chat?.id?.toString() === adminGroupId;

    if (!isAdmin(ctx.from.id) && !isFromAdminGroup) {
      await ctx.answerCbQuery("❌ Ruxsat yo'q!");
      return;
    }

    // Faqat adminlar rad etishi mumkin
    if (!isAdmin(ctx.from.id)) {
      await ctx.answerCbQuery("❌ Faqat adminlar rad etishi mumkin!");
      return;
    }

    const congratsId = ctx.match[1];
    const congrats = await getCongrats(congratsId);

    if (!congrats) {
      await ctx.answerCbQuery("❌ Topilmadi!");
      return;
    }

    await updateCongrats(congratsId, {
      rejectedByAdmin: true,
      rejectionReason: "Admin tomonidan rad etildi",
    });

    await bot.telegram.sendMessage(
      congrats.userId,
      `<b>❌ Tabrikingiz admin tomonidan tasdiqlanmadi</b>\n\n` +
        `<b>Sababi:</b> ${
          congrats.rejectionReason || "Qoidalarga mos kelmagan"
        }\n\n` +
        `💡 <i>Qayta urinib ko'ring va qoidalarga rioya qiling</i>`,
      { parse_mode: "HTML", ...keyboardMain }
    );

    await ctx.editMessageText(
      `<b>❌ Tabrik rad etildi\n\n` +
        `👤 ${congrats.firstName} (@${congrats.username || "yo'q"})\n` +
        `👨‍💼 Rad etgan: @${ctx.from.username || ctx.from.first_name}</b>`,
      { parse_mode: "HTML" }
    );

    try {
      await ctx.answerCbQuery("❌ Rad etildi!");
    } catch (cbError) {
      // Ignore callback query timeout errors
      console.log("Callback query timeout (ignore):", cbError.message);
    }
  } catch (error) {
    console.error("Admin reject xatolik:", error);
    try {
      await ctx.answerCbQuery("❌ Xatolik!");
    } catch (cbError) {
      // Ignore callback query timeout errors
    }
  }
});

bot.action("adminBroadcast", async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  await ctx.scene.enter("broadcastScene");
});

bot.action("adminChannels", async (ctx) => {
  try {
    if (!isAdmin(ctx.from.id)) return;

    const channels = await getAllChannels();
    const buttons = channels.map((ch) => [
      {
        text: `📺 ${ch.channelName} (@${ch.channelUsername})`,
        callback_data: `channelInfo_${ch.channelId}`,
      },
    ]);

    buttons.push([{ text: "➕ Kanal qo'shish", callback_data: "addChannel" }]);
    buttons.push([{ text: "🔙 Ortga", callback_data: "adminMenu" }]);

    await ctx.editMessageText(`<b>📺 KANALLAR (${channels.length} ta)</b>`, {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: buttons },
    });
  } catch (error) {
    console.error("Channels xatolik:", error);
  }
});

bot.action("addChannel", async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  await ctx.scene.enter("addChannelScene");
});

bot.action(/channelInfo_(.+)/, async (ctx) => {
  try {
    if (!isAdmin(ctx.from.id)) return;

    const channelId = ctx.match[1];
    const channel = await getChannel(channelId);

    if (!channel) {
      await ctx.answerCbQuery("❌ Topilmadi!");
      return;
    }

    await ctx.editMessageText(
      `<b>📺 KANAL MA'LUMOTLARI\n\n` +
        `📺 ${channel.channelName}\n` +
        `🆔 <code>${channel.channelId}</code>\n` +
        `📱 @${channel.channelUsername}\n` +
        `✅ Majburiy: ${channel.isRequired ? "Ha" : "Yo'q"}\n` +
        `🟢 Faol: ${channel.isActive ? "Ha" : "Yo'q"}</b>`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: channel.isRequired ? "❌ Majburiy emas" : "✅ Majburiy",
                callback_data: `toggleRequired_${channelId}`,
              },
            ],
            [
              {
                text: "🗑 O'chirish",
                callback_data: `deleteChannel_${channelId}`,
              },
            ],
            [{ text: "🔙 Ortga", callback_data: "adminChannels" }],
          ],
        },
      }
    );
  } catch (error) {
    console.error("Channel info xatolik:", error);
  }
});

bot.action(/toggleRequired_(.+)/, async (ctx) => {
  try {
    if (!isAdmin(ctx.from.id)) return;

    const channelId = ctx.match[1];
    const channel = await getChannel(channelId);

    await updateChannel(channelId, { isRequired: !channel.isRequired });
    await ctx.answerCbQuery("✅ O'zgartirildi!");

    // Refresh
    ctx.callbackQuery.data = `channelInfo_${channelId}`;
    await bot.handleUpdate({ ...ctx.update });
  } catch (error) {
    console.error("Toggle required xatolik:", error);
  }
});

bot.action(/deleteChannel_(.+)/, async (ctx) => {
  try {
    if (!isAdmin(ctx.from.id)) return;

    const channelId = ctx.match[1];
    await deleteChannel(channelId);

    await ctx.editMessageText("<b>✅ Kanal o'chirildi</b>", {
      parse_mode: "HTML",
      ...keyboardAdmin,
    });
  } catch (error) {
    console.error("Delete channel xatolik:", error);
  }
});

bot.action("adminCertificates", async (ctx) => {
  try {
    if (!isAdmin(ctx.from.id)) return;

    const certificates = await getAllCertificates();
    const buttons = certificates.map((cert) => [
      {
        text: `${cert.templateNumber}. ${cert.name} (${cert.width}x${cert.height})`,
        callback_data: `certInfo_${cert.templateNumber}`,
      },
    ]);

    buttons.push([
      { text: "➕ Sertifikat qo'shish", callback_data: "addCertificate" },
    ]);
    buttons.push([{ text: "🔙 Ortga", callback_data: "adminMenu" }]);

    await ctx.editMessageText(
      `<b>🎨 Rasmli tabriknomalar (${certificates.length} ta)</b>`,
      {
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: buttons },
      }
    );
  } catch (error) {
    console.error("Certificates xatolik:", error);
  }
});

bot.action("addCertificate", async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  await ctx.scene.enter("addCertificateScene");
});

bot.action(/certInfo_(\d+)/, async (ctx) => {
  try {
    if (!isAdmin(ctx.from.id)) return;

    const templateNumber = parseInt(ctx.match[1]);
    const cert = await getCertificate(templateNumber);

    if (!cert) {
      await ctx.answerCbQuery("❌ Topilmadi!");
      return;
    }

    await ctx.editMessageText(
      `<b>🎨 SERTIFIKAT\n\n` +
        `🔢 Template: ${cert.templateNumber}\n` +
        `📝 Nomi: ${cert.name}\n` +
        `📐 O'lcham: ${cert.width}x${cert.height} px\n` +
        `🟢 Faol: ${cert.isActive ? "Ha" : "Yo'q"}</b>`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 Ortga", callback_data: "adminCertificates" }],
          ],
        },
      }
    );
  } catch (error) {
    console.error("Cert info xatolik:", error);
  }
});

bot.action("adminMenu", async (ctx) => {
  await ctx.editMessageText("<b>🔐 ADMIN PANEL</b>", {
    parse_mode: "HTML",
    ...keyboardAdmin,
  });
});

bot.action("adminSettings", async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;

  await ctx.editMessageText(
    `<b>⚙️ SOZLAMALAR\n\n` +
      `Telegram limitleri:\n` +
      `• ${TELEGRAM_RATE_LIMIT} xabar/soniya\n` +
      `• ${BATCH_DELAY}ms kechikish\n\n` +
      `Bu sozlamalar kodda belgilangan.</b>`,
    { parse_mode: "HTML", ...keyboardAdmin }
  );
});

// Error handling
bot.catch((err, ctx) => {
  console.error("Bot xatolik:", err);
  ctx.reply("❌ Xatolik. /start bosing.");
});

bot.launch();
console.log("✅ Bot ishga tushdi!");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

// Export bot for use in admin.js
module.exports = bot;
