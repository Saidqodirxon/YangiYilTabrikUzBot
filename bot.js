const { Telegraf, Scenes, session, Markup } = require("telegraf");
require("dotenv/config");
const axios = require("axios");
const moment = require("moment-timezone");

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
  createBroadcast,
  updateBroadcast,
  getBroadcastStats,
  getAdmin,
  checkAdminPermission,
} = require("./modules/functions");

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
const ISLOM_API_LINK = "http://islomapi.uz/api";
const CERTIFICATE_API = "https://apis.realcoder.uz/api/newyear/";

// Telegram limits
const TELEGRAM_RATE_LIMIT = 30; // 30 xabar per soniya
const BATCH_DELAY = 1000; // 1 soniya

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

// --- Optional lightweight HTTP server for bot process (health checks) ---
// This allows running the bot process under PM2 and exposing a simple port.
const expressHealth = require("express");
const botApp = expressHealth();
const BOT_PORT = process.env.BOT_PORT || 9808;

botApp.get("/health", (req, res) => {
  return res.json({
    ok: true,
    uptime: process.uptime(),
    botUser: process.env.BOT_USER || null,
  });
});

botApp.get("/", (req, res) => {
  res.send("Bot process running");
});

botApp.listen(BOT_PORT, () => {
  console.log(`🤖 Bot health server listening on http://localhost:${BOT_PORT}`);
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
