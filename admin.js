const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Telegraf } = require("telegraf");
const Admin = require("./models/Admin");
const Certificate = require("./models/Certificate");
const Channel = require("./models/Channel");
const moment = require("moment-timezone");
require("dotenv/config");

// Alohida bot instance yaratamiz (admin.js dan mustaqil)
const adminBot = new Telegraf(process.env.BOT_TOKEN);

// Timezone configuration - Always use Tashkent timezone
const TIMEZONE = "Asia/Tashkent";
moment.tz.setDefault(TIMEZONE);

// Helper function to get current time in Tashkent
const getTashkentTime = () => moment.tz(TIMEZONE);

const {
  generateCertificate,
  getImageInfo,
} = require("./modules/imageProcessor");

const db = require("./modules/db");
const {
  getUsersCount,
  getAllUsers,
  getUser,
  updateUser,
  blockUser,
  unblockUser,
  getPendingCongratsForAdmin,
  getApprovedCongratsCount,
  getPendingCongratsCount,
  getCongrats,
  updateCongrats,
  getAllChannels,
  getChannel,
  createChannel,
  updateChannel,
  deleteChannel,
  getAllCertificates,
  getCertificate,
  createCertificate,
  updateCertificate,
  getBroadcastStats,
  createBroadcast,
  updateBroadcast,
  createAdmin,
  getAdmin,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  checkAdminPermission,
  getSetting,
  setSetting,
  updateCertificateById,
} = require("./modules/functions");

const app = express();
const PORT = process.env.ADMIN_PORT || 9808;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET || "bayramona-jwt-secret-key-2025";

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

// 1 soatdan eski generated rasmlarni avtomatik o‘chirish
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

// Middleware

// CORS Configuration - Bu birinchi bo'lishi kerak!
const corsOptions = {
  // Ruxsat berilgan originlar: admin frontend (9809), dev frontend (5174), bot health (9808)
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
  maxAge: 86400, // 24 soat
};

app.use(cors(corsOptions));

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// No frontend static serving here. Only API and uploads on 9808.

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

// MongoDB ulanish
db();

// ============ ROUTES ============

// ============ API ROUTES FOR REACT (JWT) ============

// Login API - Login va password bilan
app.post("/api/auth/login", async (req, res) => {
  try {
    const { login, password } = req.body;

    // Agar login va password yuborilsa - yangi tizim
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

      // Last login yangilash
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

    // Eski tizim - faqat password (backward compatibility)
    if (password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        { admin: true, timestamp: Date.now() },
        JWT_SECRET,
        {
          expiresIn: "24h",
        }
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
    console.error("Login xatolik:", error);
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Users API
app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const filter = req.query.filter || "all"; // all, active, blocked

    let allUsers = await getAllUsers();

    // Filter by status
    if (filter === "active") {
      allUsers = allUsers.filter((u) => !u.is_block);
    } else if (filter === "blocked") {
      allUsers = allUsers.filter((u) => u.is_block);
    }

    // Search
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
      data: {
        users,
        currentPage: page,
        totalPages,
        totalUsers,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Block/Unblock User API
app.post("/api/users/:userId/block", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    await blockUser(parseInt(userId));
    res.json({
      success: true,
      message: "User bloklandi",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/users/:userId/unblock", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    await unblockUser(parseInt(userId));
    res.json({
      success: true,
      message: "User blokdan chiqarildi",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Congrats API
app.get("/api/congrats", authenticateToken, async (req, res) => {
  try {
    const congrats = await getPendingCongratsForAdmin();
    res.json({
      success: true,
      data: congrats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/congrats/:id/approve", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const congrats = await getCongrats(id);

    if (!congrats) {
      return res.status(404).json({
        success: false,
        message: "Tabrik topilmadi",
      });
    }

    // Update congrats status
    await updateCongrats(id, {
      adminApproved: true,
      rejectedByAdmin: false,
      publishedToChannel: true,
      publishedAt: getTashkentTime().toDate(),
    });

    // Send to channel
    try {
      // Get publish channel from settings
      const publishChannelIdSetting = await getSetting("publish_channel_id");
      const publishChannelId = publishChannelIdSetting || null;

      let targetChannel = null;

      if (publishChannelId) {
        // Use specific channel from settings
        targetChannel = await Channel.findOne({
          channelId: publishChannelId,
          isActive: true,
        });
      } else {
        // Fallback to first active channel
        targetChannel = await Channel.findOne({ isActive: true }).sort({
          order: 1,
        });
      }

      if (targetChannel) {
        try {
          let messageText = `🎊 Yangi tabrik!\n\n`;
          messageText += `👤 ${congrats.firstName}`;
          if (congrats.username) {
            messageText += ` (@${congrats.username})`;
          }

          if (congrats.messageType === "text" && congrats.message) {
            messageText += `\n\n${congrats.message}`;
            await adminBot.telegram.sendMessage(
              targetChannel.channelId,
              messageText
            );
          } else if (congrats.messageType === "photo" && congrats.fileId) {
            await adminBot.telegram.sendPhoto(
              targetChannel.channelId,
              congrats.fileId,
              {
                caption:
                  messageText +
                  (congrats.caption ? `\n\n${congrats.caption}` : ""),
              }
            );
          } else if (congrats.messageType === "video" && congrats.fileId) {
            await adminBot.telegram.sendVideo(
              targetChannel.channelId,
              congrats.fileId,
              {
                caption:
                  messageText +
                  (congrats.caption ? `\n\n${congrats.caption}` : ""),
              }
            );
          }

          console.log(`✅ Kanal ${targetChannel.channelName} ga yuborildi`);
        } catch (channelSendError) {
          console.error(
            `❌ ${targetChannel.channelName} ga yuborishda xatolik:`,
            channelSendError.message
          );
        }
      } else {
        console.log("⚠️ Tabrik yuborish uchun faol kanal topilmadi");
      }
    } catch (channelError) {
      console.error("Kanalga yuborishda xatolik:", channelError);
      // Don't fail the approval if channel send fails
    }

    // Userga xabar yuborish
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

      await adminBot.telegram.sendMessage(
        congrats.userId,
        `<b>✅ Tabrikingiz tasdiqlandi va kanalga joylandi!${channelLink}</b>`,
        { parse_mode: "HTML" }
      );
      console.log(`✅ User ${congrats.userId} ga xabar yuborildi`);
    } catch (notifyError) {
      console.error("Userga xabar yuborishda xatolik:", notifyError.message);
    }

    res.json({
      success: true,
      message: "Tabrik tasdiqlandi va kanalga yuborildi",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/congrats/:id/reject", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const congrats = await getCongrats(id);

    if (!congrats) {
      return res.status(404).json({
        success: false,
        message: "Tabrik topilmadi",
      });
    }

    const rejectionReason = req.body.reason || "Qoidalarga mos kelmagan";

    await updateCongrats(id, {
      rejectedByAdmin: true,
      adminApproved: false,
      rejectionReason: rejectionReason,
    });

    // Userga xabar yuborish
    try {
      await adminBot.telegram.sendMessage(
        congrats.userId,
        `<b>❌ Tabrikingiz admin tomonidan tasdiqlanmadi</b>\n\n` +
          `<b>Sababi:</b> ${rejectionReason}\n\n` +
          `💡 <i>Qayta urinib ko'ring va qoidalarga rioya qiling</i>`,
        { parse_mode: "HTML" }
      );
      console.log(
        `✅ User ${congrats.userId} ga rad etilganligi haqida xabar yuborildi`
      );
    } catch (notifyError) {
      console.error("Userga xabar yuborishda xatolik:", notifyError.message);
    }

    res.json({
      success: true,
      message: "Tabrik rad etildi",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Channels API
app.get("/api/channels", authenticateToken, async (req, res) => {
  try {
    const channels = await getAllChannels();
    res.json({
      success: true,
      data: channels,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
      return res.status(400).json({
        success: false,
        message: "Channel ID va Username majburiy",
      });
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

    res.json({
      success: true,
      message: "Kanal qo'shildi",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.put("/api/channels/:id/toggle", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const channel = await getChannel(id);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Kanal topilmadi",
      });
    }

    await updateChannel(id, {
      isRequired: !channel.isRequired,
    });

    res.json({
      success: true,
      message: "Kanal holati o'zgartirildi",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.delete("/api/channels/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteChannel(id);
    res.json({
      success: true,
      message: "Kanal o'chirildi",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Certificates API
app.get("/api/certificates", authenticateToken, async (req, res) => {
  try {
    const certificates = await getAllCertificates();
    res.json({
      success: true,
      data: certificates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
        return res.status(400).json({
          success: false,
          message: "Rasm yuklanmadi",
        });
      }

      const { templateNumber, name, textConfig, width, height } = req.body;

      if (!templateNumber || !name) {
        // Delete uploaded files if validation fails
        if (req.files.image) fs.unlinkSync(req.files.image[0].path);
        if (req.files.font) fs.unlinkSync(req.files.font[0].path);
        return res.status(400).json({
          success: false,
          message: "Template raqami va nomi majburiy",
        });
      }

      // Get image info
      const imageInfo = await getImageInfo(req.files.image[0].path);

      if (!imageInfo.success) {
        if (req.files.image) fs.unlinkSync(req.files.image[0].path);
        if (req.files.font) fs.unlinkSync(req.files.font[0].path);
        return res.status(400).json({
          success: false,
          message: "Rasm ma'lumotlarini olishda xatolik",
        });
      }

      // Parse textConfig
      let parsedTextConfig = {};
      if (textConfig) {
        try {
          parsedTextConfig = JSON.parse(textConfig);
        } catch (e) {
          parsedTextConfig = {};
        }
      }

      // Agar font yuklangan bo'lsa, fontPath ni qo'shish
      if (req.files.font) {
        parsedTextConfig.fontPath = req.files.font[0].path;
        parsedTextConfig.fontFamily = req.files.font[0].originalname.replace(
          /\.(ttf|otf)$/i,
          ""
        );
      }

      // Create certificate
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
      // Delete uploaded files on error
      if (req.files) {
        if (req.files.image && fs.existsSync(req.files.image[0].path)) {
          fs.unlinkSync(req.files.image[0].path);
        }
        if (req.files.font && fs.existsSync(req.files.font[0].path)) {
          fs.unlinkSync(req.files.font[0].path);
        }
      }
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Broadcast API
app.get("/api/broadcast/stats", authenticateToken, async (req, res) => {
  try {
    const stats = await getBroadcastStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/broadcast", authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Xabar matni kiritilmagan",
      });
    }

    const users = await getAllUsers();
    let sent = 0;
    let failed = 0;

    // Create broadcast record
    const broadcast = await createBroadcast({
      message,
      totalUsers: users.length,
      sentCount: 0,
      failedCount: 0,
      status: "processing",
    });

    // Send to all users with rate limiting
    for (let i = 0; i < users.length; i++) {
      try {
        await adminBot.telegram.sendMessage(users[i].userId, message, {
          parse_mode: "HTML",
        });
        sent++;

        // Rate limiting: 30 per second
        if ((i + 1) % 30 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(
          `Xabar yuborishda xatolik ${users[i].userId}:`,
          error.message
        );
        failed++;
      }
    }

    // Update broadcast record
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Template Update API
app.put("/api/certificates/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { textConfig, width, height } = req.body;

    const updateData = {};
    if (textConfig) updateData.textConfig = textConfig;
    if (width) updateData.width = width;
    if (height) updateData.height = height;

    await updateCertificateById(id, updateData);

    res.json({
      success: true,
      message: "Template yangilandi",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Generate Certificate API
app.post("/api/generate-certificate", authenticateToken, async (req, res) => {
  try {
    const { templateId, text } = req.body;

    if (!templateId || !text) {
      return res.status(400).json({
        success: false,
        message: "Template ID va matn majburiy",
      });
    }

    const template = await Certificate.findById(templateId);
    if (!template || !template.isActive) {
      return res.status(404).json({
        success: false,
        message: "Template topilmadi",
      });
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
      res.status(500).json({
        success: false,
        message: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete Certificate Template API
app.delete("/api/certificates/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const template = await Certificate.findById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template topilmadi",
      });
    }

    // Delete template image file
    try {
      if (fs.existsSync(template.imagePath)) {
        fs.unlinkSync(template.imagePath);
      }
    } catch (fileError) {
      console.error("File delete error:", fileError);
    }

    // Delete from database
    await Certificate.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Template o'chirildi",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
        return res.status(400).json({
          success: false,
          message: "Font fayli yuklanmadi",
        });
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
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// User Block/Unblock API
app.put("/api/users/:id/block", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUser(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User topilmadi",
      });
    }

    await updateUser(id, { is_block: !user.is_block });

    res.json({
      success: true,
      message: user.is_block ? "User blokdan chiqarildi" : "User bloklandi",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ============ ADMIN MANAGEMENT API ============

// Get all admins
app.get("/api/admins", authenticateToken, async (req, res) => {
  try {
    const admins = await getAllAdmins();
    res.json({
      success: true,
      data: admins,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Add new admin
app.post("/api/admins", authenticateToken, async (req, res) => {
  try {
    const { userId, firstName, lastName, username, role, permissions } =
      req.body;

    if (!userId || !firstName) {
      return res.status(400).json({
        success: false,
        message: "userId va firstName talab qilinadi",
      });
    }

    // Faqat superadmin admin qo'sha oladi
    const currentAdmin = await getAdmin(req.user.userId);
    if (!currentAdmin || currentAdmin.role !== "superadmin") {
      return res.status(403).json({
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Update admin
app.put("/api/admins/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Faqat superadmin admin tahrirlashi mumkin
    const currentAdmin = await getAdmin(req.user.userId);
    if (!currentAdmin || currentAdmin.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Faqat superadmin admin ma'lumotlarini tahrirlashi mumkin",
      });
    }

    const updatedAdmin = await updateAdmin(id, updateData);

    if (!updatedAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin topilmadi",
      });
    }

    res.json({
      success: true,
      message: "Admin muvaffaqiyatli yangilandi",
      data: updatedAdmin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete admin
app.delete("/api/admins/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Faqat superadmin admin o'chira oladi
    const currentAdmin = await getAdmin(req.user.userId);
    if (!currentAdmin || currentAdmin.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Faqat superadmin adminni o'chira oladi",
      });
    }

    // O'zini o'chira olmaydi
    if (req.user.userId === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: "O'zingizni o'chira olmaysiz",
      });
    }

    const deletedAdmin = await deleteAdmin(id);

    if (!deletedAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin topilmadi",
      });
    }

    res.json({
      success: true,
      message: "Admin muvaffaqiyatli o'chirildi",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Check if user is admin
app.get("/api/admins/check/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const admin = await getAdmin(userId);

    res.json({
      success: true,
      isAdmin: !!admin,
      data: admin || null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ============ SETTINGS API ============

// Get setting by key
app.get("/api/settings/:key", authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const value = await getSetting(key);

    res.json({
      success: true,
      value: value, // Changed from 'data' to 'value'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Save/update setting
app.post("/api/settings", authenticateToken, async (req, res) => {
  try {
    const { key, value, description } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        message: "Key talab qilinadi",
      });
    }

    const setting = await setSetting(key, value, description);

    res.json({
      success: true,
      message: "Sozlama saqlandi",
      data: setting,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Statistika adminga yuborish funksiyasi
async function sendStatsToAdmin() {
  try {
    const adminGroupId = process.env.ADMIN_GROUP_ID;
    if (!adminGroupId) return;

    const userCount = await getUsersCount();
    const approvedCount = await getApprovedCongratsCount();
    const pendingCount = await getPendingCongratsCount();
    const broadcastStats = await getBroadcastStats();
    const channels = await getAllChannels();

    const message =
      `📊 <b>KUNLIK STATISTIKA</b>\n\n` +
      `👥 Foydalanuvchilar: ${userCount} ta\n` +
      `✅ Tasdiqlangan tabriklar: ${approvedCount} ta\n` +
      `⏳ Kutilayotgan tabriklar: ${pendingCount} ta\n` +
      `📢 Kanallar: ${channels.length} ta\n` +
      `📤 Broadcast: ${broadcastStats.completed}/${broadcastStats.total} ta\n\n` +
      `🕐 Vaqt: ${getTashkentTime().format("DD.MM.YYYY HH:mm")}`;

    await adminBot.telegram.sendMessage(adminGroupId, message, {
      parse_mode: "HTML",
    });
    console.log("📊 Statistika adminga yuborildi");
  } catch (error) {
    console.error("Statistika yuborishda xatolik:", error.message);
  }
}

// Har 24 soatda statistika yuborish (kunlik soat 20:00 da)
setInterval(async () => {
  const now = getTashkentTime();
  if (now.hour() === 20 && now.minute() === 0) {
    await sendStatsToAdmin();
  }
}, 60000); // Har daqiqada tekshirish

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🌐 Admin panel: http://localhost:${PORT}`);

  // Database connect
  await db();

  console.log("✅ Admin panel tayyor!");
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n⚠️ Admin panel to'xtatilmoqda...");
  server.close(() => {
    console.log("✅ Admin panel to'xtatildi");
    console.log("ℹ️ Bot server mustaqil ishlashda davom etmoqda");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\n⚠️ Admin panel to'xtatilmoqda...");
  server.close(() => {
    console.log("✅ Admin panel to'xtatildi");
    console.log("ℹ️ Bot server mustaqil ishlashda davom etmoqda");
    process.exit(0);
  });
});

module.exports = app;
