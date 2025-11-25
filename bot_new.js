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
  getUserCongrats,
  getSetting,
  setSetting,
} = require("./modules/functions");

// Bot initialization
const bot = new Telegraf(process.env.BOT_TOKEN);

// MongoDB'ga ulanish
db();

// Environment variables
const ramadanDate = "2025-03-01";
const botUser = process.env.BOT_USER;
const channelId = process.env.CHANNEL_ID;
const channelId2 = process.env.CHANNEL_ID2;
const channelUser = process.env.CHANNEL_USER;
const channelUser2 = process.env.CHANNEL_USER2;
const channelUser3 = process.env.CHANNEL_USER3;
const channelUser4 = process.env.CHANNEL_USER4;
const adminUser = process.env.ADMIN_USER;
const adminId = process.env.ADMIN_ID;
const ISLOM_API_LINK = "http://islomapi.uz/api";

// Tumanlar ro'yxati
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
    "Chirchiq",
    "oltiariq",
    "Rishton",
    "Qo'rg'ontepa",
    "Do'stlik",
    "Xonobod",
    "Kosonsoy",
    "Pop",
    "Quva",
    "Chust",
    "Chortoq",
    "Uchqo'rg'on",
    "Paxtaobod",
    "Zomin",
  ],
};

// ============ HELPER FUNCTIONS ============

function isAdmin(userId) {
  return userId == adminId;
}

function generateInlineKeyboard(regions) {
  try {
    const buttons = [];
    const quarterLength = Math.ceil(regions.length / 4);

    for (let i = 0; i < quarterLength; i++) {
      const buttonRow = [];

      for (let j = 0; j < 4; j++) {
        const index = i + j * quarterLength;
        if (index < regions.length) {
          buttonRow.push(
            Markup.button.callback(regions[index], `region_${regions[index]}`)
          );
        }
      }

      if (buttonRow.length > 0) {
        buttons.push(buttonRow);
      }
    }

    return buttons;
  } catch (error) {
    console.error("Keyboard yaratishda xatolik:", error);
    throw error;
  }
}

function calculateTimeToRamadan(targetDate) {
  try {
    let currentDate = moment.tz("Asia/Tashkent").toDate();
    const targetDateObject = new Date(targetDate);

    if (isNaN(targetDateObject.getTime())) {
      throw new Error("Noto'g'ri sana formati");
    }

    if (currentDate > targetDateObject) {
      targetDateObject.setFullYear(targetDateObject.getFullYear() + 1);
    }

    const timeDifference = targetDateObject - currentDate;

    return {
      remainingDays: Math.floor(timeDifference / (1000 * 60 * 60 * 24)),
      remainingHours: Math.floor(
        (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      ),
      remainingMinutes: Math.floor(
        (timeDifference % (1000 * 60 * 60)) / (1000 * 60)
      ),
      remainingSeconds: Math.floor((timeDifference % (1000 * 60)) / 1000),
    };
  } catch (error) {
    console.error("Vaqtni hisoblashda xatolik:", error);
    return null;
  }
}

async function getIslamicData(region) {
  try {
    const response = await axios.get(
      `${ISLOM_API_LINK}/present/day?region=${region}`
    );
    return response.data;
  } catch (error) {
    console.error("Islom API xatolik:", error);
    throw error;
  }
}

async function getIslamicHafta(region) {
  try {
    const response = await axios.get(
      `${ISLOM_API_LINK}/present/week?region=${region}`
    );
    return response.data;
  } catch (error) {
    console.error("Haftalik ma'lumotni olishda xatolik:", error);
    throw error;
  }
}

// ============ KEYBOARDS ============

const keyboardRestart = {
  reply_markup: {
    inline_keyboard: [[{ text: "🔄 Qaytish", callback_data: "restartBot" }]],
  },
};

const keyboardReject = {
  reply_markup: {
    inline_keyboard: [[{ text: "❌ Bekor qilish", callback_data: "reject" }]],
  },
};

const keyboardCheckReject = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "✅ Tasdiqlash", callback_data: "userApprove" }],
      [{ text: "🔄 Qayta yuborish", callback_data: "restarted" }],
      [{ text: "❌ Bekor qilish", callback_data: "reject" }],
    ],
  },
};

const keyboardAdminCheckReject = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "✅ Tasdiqlash", callback_data: "adminApprove" }],
      [{ text: "❌ Rad etish", callback_data: "adminReject" }],
    ],
  },
};

const keyboardMain = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "📖 Tabrik Yuborish", callback_data: "sendCongrats" }],
      [
        { text: "🤖 Bot haqida", callback_data: "botHaqida" },
        { text: "⭐ Taklif yuborish", callback_data: "sendSuggestion" },
      ],
    ],
  },
};

const keyboardAdmin = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "📊 Statistika", callback_data: "adminStats" }],
      [{ text: "📝 Kutilayotgan tabriklar", callback_data: "adminPending" }],
      [{ text: "📢 Xabar yuborish", callback_data: "adminBroadcast" }],
      [{ text: "⚙️ Sozlamalar", callback_data: "adminSettings" }],
      [{ text: "🔙 Ortga", callback_data: "restartBot" }],
    ],
  },
};

const keyboardMajburiyAzo = {
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "🎉 Bayramona Tabriklar",
          url: `https://t.me/${channelUser}`,
        },
      ],
      [
        {
          text: "📚 Iqtiboslar",
          url: `https://t.me/${channelUser2}`,
        },
        {
          text: "📘 Tarix",
          url: `https://t.me/${channelUser3}`,
        },
      ],
      [{ text: "✅ Tekshirish", callback_data: "checkMajburiy" }],
    ],
  },
};

// ============ SCENES ============

// Taklif yuborish scene
const taklifScene = new Scenes.BaseScene("taklifScene");

taklifScene.on("text", async (ctx) => {
  try {
    const userId = ctx.from.id;
    const firstName = ctx.from.first_name;
    const username = ctx.from.username;
    const suggestion = ctx.message.text;

    await ctx.deleteMessage();
    await ctx.reply("<b>Taklifingiz yuborildi, rahmat!</b>", {
      parse_mode: "HTML",
      ...keyboardRestart,
    });

    await bot.telegram.sendMessage(
      adminId,
      `<b>🆕 Yangi taklif:\n\n` +
        `👤 Foydalanuvchi: ${firstName}\n` +
        `🆔 ID: <code>${userId}</code>\n` +
        `📱 Username: @${username || "yo'q"}\n\n` +
        `💬 Taklif:\n${suggestion}</b>`,
      { parse_mode: "HTML" }
    );

    await ctx.scene.leave();
  } catch (error) {
    console.error("Taklif yuborishda xatolik:", error);
    await ctx.reply(
      "Xatolik yuz berdi. Qayta urinib ko'ring.",
      keyboardRestart
    );
  }
});

taklifScene.action("reject", async (ctx) => {
  await ctx.deleteMessage();
  await ctx.reply("Bekor qilindi.", { ...keyboardMain });
  await ctx.scene.leave();
});

// Tabrik yuborish scene
const tabrikScene = new Scenes.BaseScene("tabrikScene");

tabrikScene.enter(async (ctx) => {
  await ctx.reply(
    "<b>📝 Tabrik xabaringizni yuboring:\n\n" +
      "⚠️ Diqqat:\n" +
      "• Xabar matn, rasm yoki video bo'lishi mumkin\n" +
      "• Iltimos, odobli va hurmatli yozing\n" +
      "• 18+ kontent qabul qilinmaydi</b>",
    { parse_mode: "HTML", ...keyboardReject }
  );
});

tabrikScene.on("text", async (ctx) => {
  try {
    const userId = ctx.from.id;
    const firstName = ctx.from.first_name;
    const username = ctx.from.username;
    const messageText = ctx.message.text;

    await ctx.deleteMessage();

    // Session'ga saqlash
    ctx.session.congratsData = {
      userId,
      firstName,
      username,
      messageType: "text",
      message: messageText,
    };

    await ctx.reply(
      `<b>📝 Sizning xabaringiz:</b>\n\n${messageText}\n\n` +
        `<b>⚠️ Xabaringizni tasdiqlang yoki qayta yuboring</b>`,
      { parse_mode: "HTML", ...keyboardCheckReject }
    );
  } catch (error) {
    console.error("Text qayta ishlashda xatolik:", error);
    await ctx.reply("Xatolik yuz berdi.", keyboardRestart);
  }
});

tabrikScene.on("photo", async (ctx) => {
  try {
    const userId = ctx.from.id;
    const firstName = ctx.from.first_name;
    const username = ctx.from.username;
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const caption = ctx.message.caption || "";

    await ctx.deleteMessage();

    ctx.session.congratsData = {
      userId,
      firstName,
      username,
      messageType: "photo",
      fileId: photo.file_id,
      caption,
    };

    await ctx.telegram.sendPhoto(userId, photo.file_id, {
      caption: caption
        ? caption + "\n\n<b>⚠️ Rasmni tasdiqlang</b>"
        : "<b>⚠️ Rasmni tasdiqlang</b>",
      parse_mode: "HTML",
      ...keyboardCheckReject,
    });
  } catch (error) {
    console.error("Rasm qayta ishlashda xatolik:", error);
    await ctx.reply("Xatolik yuz berdi.", keyboardRestart);
  }
});

tabrikScene.on("video", async (ctx) => {
  try {
    const userId = ctx.from.id;
    const firstName = ctx.from.first_name;
    const username = ctx.from.username;
    const video = ctx.message.video;
    const caption = ctx.message.caption || "";

    await ctx.deleteMessage();

    ctx.session.congratsData = {
      userId,
      firstName,
      username,
      messageType: "video",
      fileId: video.file_id,
      caption,
    };

    await ctx.telegram.sendVideo(userId, video.file_id, {
      caption: caption
        ? caption + "\n\n<b>⚠️ Videoni tasdiqlang</b>"
        : "<b>⚠️ Videoni tasdiqlang</b>",
      parse_mode: "HTML",
      ...keyboardCheckReject,
    });
  } catch (error) {
    console.error("Video qayta ishlashda xatolik:", error);
    await ctx.reply("Xatolik yuz berdi.", keyboardRestart);
  }
});

tabrikScene.action("reject", async (ctx) => {
  await ctx.deleteMessage();
  await ctx.reply("Bekor qilindi.", { ...keyboardMain });
  await ctx.scene.leave();
});

tabrikScene.action("restarted", async (ctx) => {
  await ctx.editMessageText("<b>📝 Tabrik xabaringizni qayta yuboring</b>", {
    parse_mode: "HTML",
    ...keyboardReject,
  });
});

tabrikScene.action("userApprove", async (ctx) => {
  try {
    const congratsData = ctx.session.congratsData;

    if (!congratsData) {
      await ctx.answerCbQuery("Xabar topilmadi. Qayta yuboring.");
      return;
    }

    // MongoDB'ga saqlash
    const savedCongrats = await createCongrats({
      ...congratsData,
      userApproved: true,
    });

    await ctx.editMessageText(
      "<b>✅ Xabaringiz tasdiqlandi!\n\n" +
        "🔄 Admin tomonidan ko'rib chiqilmoqda...\n" +
        "✅ Tasdiqlansa kanalga joylanadi</b>",
      { parse_mode: "HTML", ...keyboardRestart }
    );

    // Adminga yuborish
    const adminMessage =
      `<b>🆕 Yangi tabrik:\n\n` +
      `👤 Foydalanuvchi: ${congratsData.firstName}\n` +
      `🆔 ID: <code>${congratsData.userId}</code>\n` +
      `📱 Username: @${congratsData.username || "yo'q"}\n` +
      `🆔 Tabrik ID: <code>${savedCongrats._id}</code></b>`;

    if (congratsData.messageType === "text") {
      await bot.telegram.sendMessage(
        adminId,
        adminMessage + `\n\n💬 Xabar:\n${congratsData.message}`,
        { parse_mode: "HTML", ...keyboardAdminCheckReject }
      );
    } else if (congratsData.messageType === "photo") {
      await bot.telegram.sendPhoto(adminId, congratsData.fileId, {
        caption:
          adminMessage +
          (congratsData.caption ? `\n\n📝 ${congratsData.caption}` : ""),
        parse_mode: "HTML",
        ...keyboardAdminCheckReject,
      });
    } else if (congratsData.messageType === "video") {
      await bot.telegram.sendVideo(adminId, congratsData.fileId, {
        caption:
          adminMessage +
          (congratsData.caption ? `\n\n📝 ${congratsData.caption}` : ""),
        parse_mode: "HTML",
        ...keyboardAdminCheckReject,
      });
    }

    // Session tozalash
    ctx.session.congratsData = null;
    ctx.session.currentCongratsId = savedCongrats._id.toString();

    await ctx.scene.leave();
  } catch (error) {
    console.error("User tasdiqlashda xatolik:", error);
    await ctx.answerCbQuery("Xatolik yuz berdi!");
  }
});

// Taqvim scene
const taqvimScene = new Scenes.BaseScene("taqvimScene");

taqvimScene.enter(async (ctx) => {
  try {
    const userId = ctx.from.id;
    const user = await getUser(userId);

    if (!user || !user.location) {
      await ctx.reply("<b>📍 Iltimos, joylashuvingizni tanlang</b>", {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: generateInlineKeyboard(tumanData.regions),
        },
      });
    } else {
      await ctx.reply(
        `<b>📍 Sizning joylashuvingiz: ${user.location}\n\n` +
          `Qaysi kunning namoz vaqtlarini bilmoqchisiz?</b>`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "📅 Bugun", callback_data: "taqvim_bugun" },
                { text: "📆 Haftalik", callback_data: "taqvim_hafta" },
              ],
              [
                {
                  text: "🔄 Joylashuvni o'zgartirish",
                  callback_data: "taqvim_changeLocation",
                },
              ],
              [{ text: "🔙 Ortga", callback_data: "restartBot" }],
            ],
          },
        }
      );
    }
  } catch (error) {
    console.error("Taqvim sceneda xatolik:", error);
    await ctx.reply("Xatolik yuz berdi", keyboardRestart);
  }
});

taqvimScene.action(/region_(.+)/, async (ctx) => {
  try {
    const location = ctx.match[1];
    const userId = ctx.from.id;

    await updateUser(userId, { location });

    await ctx.editMessageText(
      `<b>✅ Joylashuv saqlandi: ${location}\n\n` +
        `Qaysi kunning namoz vaqtlarini bilmoqchisiz?</b>`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "📅 Bugun", callback_data: "taqvim_bugun" },
              { text: "📆 Haftalik", callback_data: "taqvim_hafta" },
            ],
            [
              {
                text: "🔄 Joylashuvni o'zgartirish",
                callback_data: "taqvim_changeLocation",
              },
            ],
            [{ text: "🔙 Ortga", callback_data: "restartBot" }],
          ],
        },
      }
    );
  } catch (error) {
    console.error("Joylashuv saqlashda xatolik:", error);
    await ctx.answerCbQuery("Xatolik yuz berdi!");
  }
});

taqvimScene.action("taqvim_changeLocation", async (ctx) => {
  await ctx.editMessageText("<b>📍 Yangi joylashuvingizni tanlang</b>", {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: generateInlineKeyboard(tumanData.regions),
    },
  });
});

taqvimScene.action("taqvim_bugun", async (ctx) => {
  try {
    const userId = ctx.from.id;
    const user = await getUser(userId);

    if (!user || !user.location) {
      await ctx.answerCbQuery("Iltimos, joylashuvni tanlang!");
      return;
    }

    const data = await getIslamicData(user.location);
    const date = data.date;
    const hijriDate = data.hijri_date;
    const times = data.times;

    const message =
      `<b>📅 ${date} (${hijriDate.day}-${hijriDate.month})\n` +
      `📍 ${user.location}\n\n` +
      `🕌 Namoz vaqtlari:\n\n` +
      `🕋 Bomdod: ${times.tong_saharlik}\n` +
      `☀️ Quyosh: ${times.quyosh}\n` +
      `🌤 Peshin: ${times.peshin}\n` +
      `🌥 Asr: ${times.asr}\n` +
      `🌆 Shom: ${times.shom_iftor}\n` +
      `🌙 Xufton: ${times.hufton}</b>`;

    await ctx.editMessageText(message, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 Ortga", callback_data: "taqvim_back" }],
          [{ text: "🏠 Bosh menyu", callback_data: "restartBot" }],
        ],
      },
    });
  } catch (error) {
    console.error("Bugungi namoz vaqtini olishda xatolik:", error);
    await ctx.answerCbQuery("Xatolik yuz berdi!");
  }
});

taqvimScene.action("taqvim_hafta", async (ctx) => {
  try {
    const userId = ctx.from.id;
    const user = await getUser(userId);

    if (!user || !user.location) {
      await ctx.answerCbQuery("Iltimos, joylashuvni tanlang!");
      return;
    }

    const weekData = await getIslamicHafta(user.location);
    let message = `<b>📆 Haftalik namoz vaqtlari\n📍 ${user.location}\n\n</b>`;

    weekData.forEach((day) => {
      message +=
        `<b>${day.date} ${day.weekday}</b>\n` +
        `🕋 ${day.times.tong_saharlik} | ☀️ ${day.times.quyosh} | ` +
        `🌤 ${day.times.peshin} | 🌥 ${day.times.asr} | ` +
        `🌆 ${day.times.shom_iftor} | 🌙 ${day.times.hufton}\n\n`;
    });

    await ctx.editMessageText(message, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 Ortga", callback_data: "taqvim_back" }],
          [{ text: "🏠 Bosh menyu", callback_data: "restartBot" }],
        ],
      },
    });
  } catch (error) {
    console.error("Haftalik namoz vaqtini olishda xatolik:", error);
    await ctx.answerCbQuery("Xatolik yuz berdi!");
  }
});

taqvimScene.action("taqvim_back", async (ctx) => {
  ctx.scene.reenter();
});

// Stage yaratish
const stage = new Scenes.Stage([taklifScene, tabrikScene, taqvimScene]);

bot.use(session());
bot.use(stage.middleware());

// ============ BOT COMMANDS & ACTIONS ============

bot.command("start", async (ctx) => {
  try {
    ctx.scene.leave();

    const userId = ctx.from.id;
    const firstName = ctx.from.first_name;
    const username = ctx.from.username;

    // Kanalga a'zolikni tekshirish
    let isMember = false;
    try {
      const member1 = await ctx.telegram.getChatMember(channelId, userId);
      const member2 = await ctx.telegram.getChatMember(channelId2, userId);

      isMember =
        ["member", "administrator", "creator"].includes(member1.status) &&
        ["member", "administrator", "creator"].includes(member2.status);
    } catch (error) {
      console.error("A'zolikni tekshirishda xatolik:", error);
    }

    // Foydalanuvchini bazaga qo'shish/yangilash
    let user = await getUser(userId);
    if (!user) {
      user = await createUser(userId, firstName, username);

      // Adminga xabar
      const userCount = await getUsersCount();
      await bot.telegram.sendMessage(
        adminId,
        `🆕 Yangi foydalanuvchi [${userCount}]\n\n` +
          `👤 ${firstName}\n` +
          `🆔 <code>${userId}</code>\n` +
          `📱 @${username || "yo'q"}`,
        { parse_mode: "HTML" }
      );
    }

    if (!isMember) {
      await ctx.reply(
        `<b>Assalomu Alaykum! 👋\n\n` +
          `Botdan foydalanish uchun quyidagi kanallarga a'zo bo'ling:</b>`,
        { parse_mode: "HTML", ...keyboardMajburiyAzo }
      );
    } else {
      await ctx.reply(
        `<b>Assalomu Alaykum, ${firstName}! 👋\n\n` +
          `🎉 Bayramona Tabriklar botiga xush kelibsiz!\n\n` +
          `Quyidagi tugmalardan foydalaning:</b>`,
        { parse_mode: "HTML", ...keyboardMain }
      );
    }
  } catch (error) {
    console.error("Start commandda xatolik:", error);
    await ctx.reply("Xatolik yuz berdi. Qayta /start bosing.");
  }
});

bot.command("admin", async (ctx) => {
  try {
    ctx.scene.leave();

    if (!isAdmin(ctx.from.id)) {
      await ctx.reply("Bu buyruq faqat admin uchun!");
      return;
    }

    const userCount = await getUsersCount();
    const approvedCount = await getApprovedCongratsCount();
    const pendingCount = await getPendingCongratsCount();

    await ctx.reply(
      `<b>🔐 Admin Panel\n\n` +
        `👥 Foydalanuvchilar: ${userCount}\n` +
        `✅ Tasdiqlangan tabriklar: ${approvedCount}\n` +
        `⏳ Kutilayotgan: ${pendingCount}</b>`,
      { parse_mode: "HTML", ...keyboardAdmin }
    );
  } catch (error) {
    console.error("Admin commandda xatolik:", error);
    await ctx.reply("Xatolik yuz berdi.");
  }
});

// Action handlers
bot.action("checkMajburiy", async (ctx) => {
  try {
    const userId = ctx.from.id;
    const member1 = await ctx.telegram.getChatMember(channelId, userId);
    const member2 = await ctx.telegram.getChatMember(channelId2, userId);

    const isMember =
      ["member", "administrator", "creator"].includes(member1.status) &&
      ["member", "administrator", "creator"].includes(member2.status);

    if (isMember) {
      await ctx.editMessageText(
        `<b>✅ A'zolik tasdiqlandi!\n\n` +
          `Botdan foydalanishingiz mumkin:</b>`,
        { parse_mode: "HTML", ...keyboardMain }
      );
    } else {
      await ctx.answerCbQuery("❌ Iltimos, barcha kanallarga a'zo bo'ling!", {
        show_alert: true,
      });
    }
  } catch (error) {
    console.error("A'zolikni tekshirishda xatolik:", error);
    await ctx.answerCbQuery("Xatolik yuz berdi!");
  }
});

bot.action("sendCongrats", async (ctx) => {
  await ctx.scene.enter("tabrikScene");
});

bot.action("sendSuggestion", async (ctx) => {
  await ctx.scene.enter("taklifScene");
});

bot.action("botHaqida", async (ctx) => {
  await ctx.editMessageText(
    `<b>🤖 BOT HAQIDA\n\n` +
      `👨‍💻 Dasturchi: Saidqodirxon Rahimov\n` +
      `📱 Telegram: @${adminUser}\n\n` +
      `📖 Bot maqsadi:\n` +
      `Bu bot orqali siz bayramona tabriklaringizni @${channelUser} kanaliga yuborishingiz mumkin.\n\n` +
      `🔗 Bizning kanallar:</b>`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🎉 Bayramona Tabriklar",
              url: `https://t.me/${channelUser}`,
            },
          ],
          [
            { text: "📚 Iqtiboslar", url: `https://t.me/${channelUser2}` },
            { text: "📘 Tarix", url: `https://t.me/${channelUser3}` },
          ],
          [{ text: "👨‍💻 Dasturchi", url: `https://t.me/${adminUser}` }],
          [{ text: "🔙 Ortga", callback_data: "restartBot" }],
        ],
      },
    }
  );
});

bot.action("restartBot", async (ctx) => {
  ctx.scene.leave();
  await ctx.editMessageText(
    `<b>🏠 BOSH MENYU\n\nQuyidagi tugmalardan foydalaning:</b>`,
    { parse_mode: "HTML", ...keyboardMain }
  );
});

bot.action("reject", async (ctx) => {
  ctx.scene.leave();
  await ctx.editMessageText("<b>❌ Bekor qilindi</b>", {
    parse_mode: "HTML",
    ...keyboardMain,
  });
});

// Admin actions
bot.action("adminStats", async (ctx) => {
  try {
    if (!isAdmin(ctx.from.id)) {
      await ctx.answerCbQuery("Ruxsat yo'q!");
      return;
    }

    const userCount = await getUsersCount();
    const approvedCount = await getApprovedCongratsCount();
    const pendingCount = await getPendingCongratsCount();

    await ctx.editMessageText(
      `<b>📊 STATISTIKA\n\n` +
        `👥 Jami foydalanuvchilar: ${userCount}\n` +
        `✅ Tasdiqlangan tabriklar: ${approvedCount}\n` +
        `⏳ Kutilayotgan tabriklar: ${pendingCount}\n` +
        `📈 Bugun qo'shilganlar: 0</b>`,
      { parse_mode: "HTML", ...keyboardAdmin }
    );
  } catch (error) {
    console.error("Statistika olishda xatolik:", error);
    await ctx.answerCbQuery("Xatolik yuz berdi!");
  }
});

bot.action("adminPending", async (ctx) => {
  try {
    if (!isAdmin(ctx.from.id)) {
      await ctx.answerCbQuery("Ruxsat yo'q!");
      return;
    }

    const pending = await getPendingCongratsForAdmin();

    if (pending.length === 0) {
      await ctx.answerCbQuery("Kutilayotgan tabriklar yo'q!", {
        show_alert: true,
      });
      return;
    }

    await ctx.editMessageText(
      `<b>⏳ Kutilayotgan tabriklar: ${pending.length} ta\n\n` +
        `Birinchi tabrikni ko'rish uchun "Ko'rish" tugmasini bosing</b>`,
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
    console.error("Kutilayotgan tabriklarni olishda xatolik:", error);
    await ctx.answerCbQuery("Xatolik yuz berdi!");
  }
});

bot.action(/viewPending_(.+)/, async (ctx) => {
  try {
    if (!isAdmin(ctx.from.id)) {
      await ctx.answerCbQuery("Ruxsat yo'q!");
      return;
    }

    const congratsId = ctx.match[1];
    const congrats = await getCongrats(congratsId);

    if (!congrats) {
      await ctx.answerCbQuery("Tabrik topilmadi!");
      return;
    }

    ctx.session.currentCongratsId = congratsId;

    const adminMessage =
      `<b>🆕 Tabrik ID: <code>${congratsId}</code>\n\n` +
      `👤 ${congrats.firstName}\n` +
      `🆔 <code>${congrats.userId}</code>\n` +
      `📱 @${congrats.username || "yo'q"}</b>`;

    if (congrats.messageType === "text") {
      await ctx.editMessageText(
        adminMessage + `\n\n💬 Xabar:\n${congrats.message}`,
        { parse_mode: "HTML", ...keyboardAdminCheckReject }
      );
    } else if (congrats.messageType === "photo") {
      await ctx.deleteMessage();
      await ctx.telegram.sendPhoto(adminId, congrats.fileId, {
        caption:
          adminMessage + (congrats.caption ? `\n\n📝 ${congrats.caption}` : ""),
        parse_mode: "HTML",
        ...keyboardAdminCheckReject,
      });
    } else if (congrats.messageType === "video") {
      await ctx.deleteMessage();
      await ctx.telegram.sendVideo(adminId, congrats.fileId, {
        caption:
          adminMessage + (congrats.caption ? `\n\n📝 ${congrats.caption}` : ""),
        parse_mode: "HTML",
        ...keyboardAdminCheckReject,
      });
    }
  } catch (error) {
    console.error("Tabrikni ko'rishda xatolik:", error);
    await ctx.answerCbQuery("Xatolik yuz berdi!");
  }
});

bot.action("adminApprove", async (ctx) => {
  try {
    if (!isAdmin(ctx.from.id)) {
      await ctx.answerCbQuery("Ruxsat yo'q!");
      return;
    }

    const congratsId = ctx.session.currentCongratsId;
    if (!congratsId) {
      await ctx.answerCbQuery("Tabrik topilmadi!");
      return;
    }

    const congrats = await getCongrats(congratsId);
    if (!congrats) {
      await ctx.answerCbQuery("Tabrik topilmadi!");
      return;
    }

    // Admin tomonidan tasdiqlash
    await updateCongrats(congratsId, {
      adminApproved: true,
      publishedToChannel: true,
      publishedAt: new Date(),
    });

    // Kanalga yuborish
    const channelMessage = congrats.message || congrats.caption || "";
    const footer = `\n\n📖 @${botUser} orqali tabrik yuboring!`;

    if (congrats.messageType === "text") {
      await bot.telegram.sendMessage(channelId, channelMessage + footer);
    } else if (congrats.messageType === "photo") {
      await bot.telegram.sendPhoto(channelId, congrats.fileId, {
        caption: channelMessage + footer,
      });
    } else if (congrats.messageType === "video") {
      await bot.telegram.sendVideo(channelId, congrats.fileId, {
        caption: channelMessage + footer,
      });
    }

    // Foydalanuvchiga xabar
    await bot.telegram.sendMessage(
      congrats.userId,
      `<b>✅ Tabrikingiz tasdiqlandi va @${channelUser} kanaliga joylandi!</b>`,
      { parse_mode: "HTML", ...keyboardMain }
    );

    await ctx.editMessageText(
      "<b>✅ Tabrik tasdiqlandi va kanalga joylandi!</b>",
      { parse_mode: "HTML", ...keyboardAdmin }
    );

    ctx.session.currentCongratsId = null;
  } catch (error) {
    console.error("Admin tasdiqlashda xatolik:", error);
    await ctx.answerCbQuery("Xatolik yuz berdi!");
  }
});

bot.action("adminReject", async (ctx) => {
  try {
    if (!isAdmin(ctx.from.id)) {
      await ctx.answerCbQuery("Ruxsat yo'q!");
      return;
    }

    const congratsId = ctx.session.currentCongratsId;
    if (!congratsId) {
      await ctx.answerCbQuery("Tabrik topilmadi!");
      return;
    }

    const congrats = await getCongrats(congratsId);
    if (!congrats) {
      await ctx.answerCbQuery("Tabrik topilmadi!");
      return;
    }

    // Rad etish
    await updateCongrats(congratsId, {
      rejectedByAdmin: true,
      rejectionReason: "Admin tomonidan rad etildi",
    });

    // Foydalanuvchiga xabar
    await bot.telegram.sendMessage(
      congrats.userId,
      `<b>❌ Tabrikingiz admin tomonidan rad etildi.\n\n` +
        `Sababi: Qoidalarga mos kelmagan yoki noto'g'ri mazmun.\n\n` +
        `Iltimos, qayta urinib ko'ring.</b>`,
      { parse_mode: "HTML", ...keyboardMain }
    );

    await ctx.editMessageText(
      "<b>❌ Tabrik rad etildi va foydalanuvchiga xabar yuborildi</b>",
      { parse_mode: "HTML", ...keyboardAdmin }
    );

    ctx.session.currentCongratsId = null;
  } catch (error) {
    console.error("Admin rad etishda xatolik:", error);
    await ctx.answerCbQuery("Xatolik yuz berdi!");
  }
});

bot.action("adminMenu", async (ctx) => {
  await ctx.editMessageText(`<b>🔐 ADMIN PANEL</b>`, {
    parse_mode: "HTML",
    ...keyboardAdmin,
  });
});

// Error handling
bot.catch((err, ctx) => {
  console.error("Bot xatolik:", err);
  ctx.reply("Xatolik yuz berdi. Iltimos, /start bosing.");
});

// Launch
bot.launch();
console.log("✅ Bot ishga tushdi!");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
