const { Telegraf, Scenes, session, Markup } = require("telegraf");
require("dotenv/config");
const fs = require("fs");
const axios = require("axios");
const { Buffer } = require("buffer");
const db = require("./modules/db");
const User = require("./models/User");
const bot = new Telegraf(process.env.BOT_TOKEN);
const moment = require("moment-timezone");

// db();
// Ramazon vaqtini Islom.uz ilovasidan koʻrib [yil-oy-kun] [2024-oy-kun] formatda yozish kerak
const ramadanDate = "2024-03-11";

const botUser = process.env.BOT_USER;
const channelId = process.env.CHANNEL_ID;
const channelId2 = process.env.CHANNEL_ID2;
const channelId3 = process.env.CHANNEL_ID3;
const channelId4 = process.env.CHANNEL_ID4;
const channelUser = process.env.CHANNEL_USER;
const channelUser2 = process.env.CHANNEL_USER2;
const channelUser3 = process.env.CHANNEL_USER3;
const channelUser4 = process.env.CHANNEL_USER4;
const channelUser5 = process.env.CHANNEL_USER5;
const channelUser6 = process.env.CHANNEL_USER6;
const instagramUser = process.env.INSTAGRAM_USER;
const youtubeUser = process.env.YOUTUBE_USER;
const tiktokUser = process.env.TIKTOK_USER;
const twitterUser = process.env.TWITTER_USER;

// start
const adminUser = process.env.ADMIN_USER;
const adminId = process.env.ADMIN_ID;
let ISLOM_API_LINK = "http://islomapi.uz/api";
const realcoderAPI = "https://apis.realcoder.uz/api/newyear/";

const tumanData = {
  regions: [
    "oltiariq",
    "Bishkek",
    "O'smat",
    "To'rtko'l",
    "Uzunquduq",
    "Jizzax",
    "oltinko'l",
    "Chimkent",
    "Rishton",
    "Xo'jaobod",
    "Do'stlik",
    "Buxoro",
    "Termiz",
    "Dushanbye",
    "Turkmanobod",
    "Qorovulbozor",
    "olmaota",
    "Xonqa",
    "Tallimarjon",
    "Uchqo'rg'on",
    "Uchtepa",
    "Xonobod",
    "Toshkent",
    "G'uzor",
    "Bekobod",
    "Navoiy",
    "Qo'rg'ontepa",
    "Muborak",
    "Ashxabod",
    "olot",
    "Jalolobod",
    "Nurota",
    "Andijon",
    "Turkiston",
    "Shumanay",
    "Namangan",
    "Chimboy",
    "Jomboy",
    "Sherobod",
    "Mo'ynoq",
    "Buloqboshi",
    "Uchquduq",
    "Samarqand",
    "Qiziltepa",
    "Zomin",
    "Xo'jand",
    "Tomdi",
    "Yangibozor",
    "Jambul",
    "Nukus",
    "Chortoq",
    "Taxtako'pir",
    "Toshhovuz",
    "Xiva",
    "Kosonsoy",
    "Konimex",
    "Mingbuloq",
    "Paxtaobod",
    "Denov",
    "O'g'iz",
    "Qo'ng'irot",
    "Chust",
    "Kattaqo'rg'on",
    "Farg'ona",
    "Qorako'l",
    "Arnasoy",
    "Osh",
    "Sayram",
    "Angren",
    "Pop",
    "G'allaorol",
    "Urgut",
    "Shahrixon",
    "Guliston",
    "Qumqo'rg'on",
    "Boysun",
    "Urganch",
    "Qo'qon",
    "Gazli",
    "Xazorasp",
    "Marg'ilon",
    "Shovot",
    "Konibodom",
    "Quva",
    "Burchmulla",
    "Dehqonobod",
    "Zarafshon",
    "Qarshi",
    "Koson",
  ],
};

function generateInlineKeyboard(regions) {
  try {
    const buttons = [];
    const totalRegions = regions.length;
    const quarterLength = Math.ceil(totalRegions / 4);

    for (let i = 0; i < quarterLength; i++) {
      const firstRegion = regions[i];
      const secondRegion =
        i + quarterLength < totalRegions ? regions[i + quarterLength] : null;
      const thirdRegion =
        i + 2 * quarterLength < totalRegions
          ? regions[i + 2 * quarterLength]
          : null;
      const fourthRegion =
        i + 3 * quarterLength < totalRegions
          ? regions[i + 3 * quarterLength]
          : null;

      const buttonRow = [];

      if (firstRegion) {
        buttonRow.push(Markup.button.callback(firstRegion, firstRegion));
      }
      if (secondRegion) {
        buttonRow.push(Markup.button.callback(secondRegion, secondRegion));
      }
      if (thirdRegion) {
        buttonRow.push(Markup.button.callback(thirdRegion, thirdRegion));
      }
      if (fourthRegion) {
        buttonRow.push(Markup.button.callback(fourthRegion, fourthRegion));
      }

      buttons.push(buttonRow);
    }

    return buttons;
  } catch (error) {
    console.error("Error in generateInlineKeyboard function:", error);
    // Handle the error here, e.g., log it or throw it further
    // If you throw it further, ensure to catch it where the function is being called.
    throw error;
  }
}

const taklifScene = new Scenes.BaseScene("taklifScene");
// approveTabrik
taklifScene.on("text", async (ctx) => {
  try {
    const userId = ctx.from.id;
    const firstName = ctx.from.first_name;
    const userSuggestion = ctx.message.text;
    let username = ctx.from.username;

    await ctx.deleteMessage();

    await ctx.reply(
      "<b>Taklifingiz yuborildi, taklif bildirganingiz uchun rahmat!</b>",
      {
        parse_mode: "HTML",
        ...keyboardrestart,
      }
    );

    // Send the suggestion to the admin
    await bot.telegram.sendMessage(
      adminId,
      `<b>Foydalanuvchi fikr bildirdi: ${firstName} \nID: <code>${userId}</code>\nUsername: @${
        username === undefined ? "" : username
      }taklif yubordi:\nXabari:\n${userSuggestion}</b>`,
      { parse_mode: "HTML" }
    );

    await ctx.scene.leave();
  } catch (error) {
    console.error("Error in taklifScene text handler:", error);
    // Handle the error here, e.g., log it or throw it further
    // If you throw it further, ensure to catch it where the scene is being run.
    throw error;
  }
});
taklifScene.action("rejectTaklif", async (ctx) => {
  try {
    await ctx.deleteMessage();

    await ctx.reply(
      "<b>Botni ishlatish uchun pastdagi tugmalardan foydalaning 👇</b>",
      { parse_mode: "HTML", ...keyboardTabrikYollash }
    );

    await ctx.scene.leave();
  } catch (error) {
    console.error("Error in rejectTaklif action:", error);
    // Handle the error here, e.g., log it or throw it further
    // If you throw it further, ensure to catch it where the scene is being run.
    throw error;
  }
});

// stat
const tabrikYollashScene = new Scenes.BaseScene("tabrikYollash");
let originalMessage = null; // Store the original message
let pendingMessage = null; // Store the message being composed

tabrikYollashScene.on("text", async (ctx) => {
  try {
    const updatedMessage = ctx.message.text;
    console.log(ctx, "ctx");
    console.log(ctx.from, "ctx from");
    await ctx.deleteMessage();

    let userIds = ctx.from.id;
    let firstName = ctx.from.first_name;

    ctx.session.firstName = firstName;
    ctx.session.userIds = userIds;

    await ctx.reply("Sizning Xabaringiz :\n\n" + " " + updatedMessage, {
      parse_mode: "HTML",
    });

    if (updatedMessage) {
      pendingMessage = updatedMessage; // Store the message being composed
      await ctx.reply(
        `<b>🚫Tabrikingizda xatolik yoki nomaqbul (18+) soʻzlar ishlatilgan boʻlsa toʻgʻirlab qayta yuboring\n\n⚠️Toʻgʻri deb hisoblasangiz xabaringizni tasdiqlang.</b>`,
        { parse_mode: "HTML", ...keyboardCheckReject }
      );
    } else {
      await ctx.reply("Botda Xatolik qayta urinib koʻring", keyboardrestart);
    }
  } catch (error) {
    console.error("Error in tabrikYollashScene text handler:", error);
    // Handle the error here, e.g., log it or throw it further
    // If you throw it further, ensure to catch it where the scene is being run.
    throw error;
  }
});

tabrikYollashScene.on("photo", async (ctx) => {
  try {
    ctx.deleteMessage();
    // Handle photo messages here
    const photo = ctx.message.photo[0]; // Assuming you want the first photo in the array
    const fileId = photo.file_id;
    const photoCaption = ctx.message.caption || "";

    ctx.session.fileId = fileId;
    ctx.session.photo = photo;
    ctx.session.photoCaption = photoCaption;

    console.log(photo, "photo");
    console.log(fileId, "fileId");

    await ctx.telegram.sendPhoto(ctx.from.id, fileId, {
      caption: photoCaption,
    });

    await ctx.reply("<b>Tabrikingizni tasdiqlang.</b>", {
      parse_mode: "HTML",
      ...keyboardCheckReject,
    });

    pendingMessage = null;
    ctx.scene.leave();
  } catch (error) {
    console.error("Error handling photo message:", error);
    await ctx.reply(
      "Xatolik yuz berdi. Qayta urinib koʻring.",
      keyboardCheckReject
    );
  }
});

tabrikYollashScene.on("video", async (ctx) => {
  try {
    ctx.deleteMessage();
    const video = ctx.message.video;
    const videoId = video.file_id;
    const videoCaption = ctx.message.caption || "";

    ctx.session.videoId = videoId;
    ctx.session.video = video;
    ctx.session.videoCaption = videoCaption;

    console.log(video, "video");
    console.log(videoId, "videoId");

    await ctx.telegram.sendVideo(ctx.from.id, videoId, {
      caption: videoCaption,
    });

    await ctx.reply("Tabrikingizni tasdiqlang.", keyboardCheckReject);

    pendingMessage = null;
    ctx.scene.leave();
  } catch (error) {
    console.error("Error handling video message:", error);
    await ctx.reply(
      "Xatolik yuz berdi. Qayta urinib koʻring.",
      keyboardCheckReject
    );
  }
});

// calculate new year

function calculateTimeToRamadan(targetDate) {
  try {
    // Get the current date and time in the Asia/Tashkent timezone
    let currentDate = moment.tz("Asia/Tashkent");

    // Convert the moment object to a JavaScript Date object
    currentDate = currentDate.toDate();

    const targetDateObject = new Date(targetDate);

    // Check if the target date is in the past relative to the current date
    if (isNaN(targetDateObject.getTime())) {
      throw new Error("Invalid target date format");
    }

    if (currentDate > targetDateObject) {
      targetDateObject.setFullYear(targetDateObject.getFullYear() + 1);
    }

    const timeDifference = targetDateObject - currentDate;

    // Calculate the remaining time in days, hours, minutes, and seconds
    const remainingDays = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const remainingHours = Math.floor(
      (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const remainingMinutes = Math.floor(
      (timeDifference % (1000 * 60 * 60)) / (1000 * 60)
    );
    const remainingSeconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

    return {
      remainingDays: remainingDays,
      remainingHours: remainingHours,
      remainingMinutes: remainingMinutes,
      remainingSeconds: remainingSeconds,
    };
  } catch (error) {
    console.error("Error in calculateTimeToRamadan function:", error);
    // Handle the error here, e.g., log it or throw it further
    return null; // Or handle the error accordingly
  }
}

// Hozirgi vaqtni hisoblash uchun funksiya
function getCurrentTime() {
  try {
    let currentDate = moment.tz("Asia/Tashkent");

    const formattedDate = currentDate.format("YYYY-MM-DD HH:mm:ss");

    return {
      currentHours: currentDate.hours(),
      currentMinutes: currentDate.minutes(),
      currentSeconds: currentDate.seconds(),
      currentDate: formattedDate,
    };
  } catch (error) {
    console.error("Error in getCurrentTime function:", error);
    return null; // Or handle the error accordingly
  }
}

// Create Certificate

const createCertificateScene = new Scenes.BaseScene("createCertificate");
//ramadan
let userText;

createCertificateScene.enter((ctx) => {
  console.log("shu yerda ");
  ctx.reply("Sertifikat tayyorlash uchun text yuboring:", keyboardReject);
});

// Listen for text messages within the scene
createCertificateScene.hears(/.*/, async (ctx) => {
  // Set userText when a text message is received
  userText = ctx.message.text;

  // Ask the user to select a button
  const inlineKeyboard = [
    [{ text: "❌ Bekor qilish", callback_data: "restartBot" }],
  ];
  for (let i = 1; i <= 7; i++) {
    inlineKeyboard.push([createInlineButton(i)]);
  }

  const inlineKeyboardString = JSON.stringify(inlineKeyboard);

  ctx.reply("Bizda 7-xil dizayn mavjud. \n\nRaqamlardan birini tanlang:", {
    reply_markup: {
      inline_keyboard: inlineKeyboard,
    },
  });
});

// Listen for button presses within the scene
createCertificateScene.action(/select_(\d+)/, async (ctx) => {
  const buttonNumber = ctx.match[1];

  console.log(buttonNumber, "ButtonNumber");

  try {
    if (userText) {
      const text = userText;
      const apiUrl = `${realcoderAPI}${buttonNumber}?text=${text}`;
      console.log(apiUrl, "apiUrl");
      const caption = "Sertifikat muvvafaqiyatli yasaldi.";

      await ctx.replyWithPhoto({ url: apiUrl }, { caption });
    }
    console.log(userText, "UserText");
  } catch (error) {
    ctx.reply(`Sertifikat yasalmadi, XATO likni @${adminUser} ga xabar qiling`);
  }

  // Leave the scene after processing the action
  ctx.scene.leave();
});

const taqvim = new Scenes.BaseScene("taqvim");

taqvim.enter((ctx) => {
  try {
    let userId = ctx.from.id;
    let userIDs = loadUserIds();
    let selectedLocation;

    // Foydalanuvchining avval tanlaganligini tekshiramiz
    if (
      userIDs.some((user) => user.id === userId && user.location === undefined)
    ) {
      ctx.deleteMessage();
      ctx.reply(
        `<b>Siz joylashuvingizni tanlamagan ekansiz iltimos oldin joylashuvingizni tanlang:\n\nAmalni bekor qilmoqchi bo'lsangiz yoki bot qotib qolsa qaytadan /start bosing.</b>`,
        {
          parse_mode: "HTML",
          ...keyboardLocation, // Tugmalarni chiqarish uchun klaviatura
        }
      );

      // selectedLocation = ctx.session.selectedRegion;
      // console.log(selectedLocation);
      // userIDs.push({ location: selectedLocation });
      // saveUserIds(userIDs);
    } else {
      ctx.deleteMessage();
      // Foydalanuvchi avval tanlagan joylashuvi bor
      selectedLocation = userIDs.find((user) => user.id === userId).location;
      ctx.reply(
        `<b>Sizning joylashuvingiz: <code>${selectedLocation}</code>.\nAgar joylashuvingiz oʻzgargan boʻlsa pastdagi tugmani bosgan holda joylashuvingizni oʻzgartirishingiz mumkin.\n\nQaysi kunni taqvimini bilmoqchisiz?\n\nAmalni bekor qilmoqchi bo'lsangiz yoki bot qotib qolsa qaytadan /start bosing.</b>`,
        { parse_mode: "HTML", ...keyboardDateType } // Tugmalarni chiqarish uchun klaviatura
      );
    }
  } catch (error) {
    ctx.reply("ERROR ");
    // Xatolikni identifikatsiya qilish yoki boshqa ravishda qo'lda qilish kerak
  }
});

// Tuman tanlash uchun hodisa

//getchat
taqvim.action("TUMAN_TANLASH", (ctx) => {
  try {
    const regions = tumanData.regions; // Tumanlar ro'yxati

    let userId = ctx.from.id;
    let userIDs = loadUserIds();

    if (
      userIDs.some((user) => user.id === userId && user.location === undefined)
    ) {
      // Foydalanuvchi avval tanlagan joylashuvi yo'q
      ctx.deleteMessage();
      ctx.replyWithHTML(
        `<b>Joylashuvingizni tanlang.\n\nAmalni bekor qilmoqchi bo'lsangiz yoki bot qotib qolsa qaytadan /start bosing.</b>`,
        Markup.inlineKeyboard(generateInlineKeyboard(regions), {
          columns: 2,
        }).resize()
      );
    } else {
      // Foydalanuvchi avval tanlagan joylashuvi bor
      let selectedLocation = userIDs.find(
        (user) => user.id === userId
      ).location;

      ctx.reply(
        `<b>Sizning tanlagan joylashuvingiz: <code>${selectedLocation}</code>.\nAgar joylashuvingiz oʻzgargan boʻlsa pastdagi tugmani bosgan holda joylashuvingizni oʻzgartirishingiz mumkin.\n\nQaysi kunni taqvimini bilmoqchisiz?\n\nAmalni bekor qilmoqchi bo'lsangiz yoki bot qotib qolsa qaytadan /start bosing.</b>`,
        { parse_mode: "HTML", ...keyboardDateType } // Tugmalarni chiqarish uchun klaviatura
      );
    }
  } catch (error) {
    console.error("Error in taqvim.action function:", error);
    // Xatolikni identifikatsiya qilish yoki boshqa ravishda qo'lda qilish kerak
  }
});

taqvim.action("TUMAN_QAYTA_TANLASH", (ctx) => {
  try {
    const regions = tumanData.regions; // Tumanlar ro'yxati

    let userId = ctx.from.id;
    let userIDs = loadUserIds();

    if (
      userIDs.some((user) => user.id === userId && user.location != undefined)
    ) {
      // Foydalanuvchi avval tanlagan joylashuvi yo'q
      ctx.deleteMessage();
      ctx.replyWithHTML(
        `<b>Joylashuvingizni tanlang.\n\nAmalni bekor qilmoqchi bo'lsangiz yoki bot qotib qolsa qaytadan /start bosing.</b>`,
        Markup.inlineKeyboard(generateInlineKeyboard(regions), {
          columns: 2,
        }).resize()
      );
    }
  } catch (error) {
    console.error("Error in taqvim.action function:", error);
    ctx.reply("error"); // Xatolikni identifikatsiya qilish yoki foydalanuvchiga xabar berish
  }
});
taqvim.on("callback_query", (ctx) => {
  try {
    let userId = ctx.from.id;
    let userIDs = loadUserIds();

    if (
      userIDs.some(
        (user) => user.id === userId && user.location === undefined
      ) ||
      userIDs.some((user) => user.id === userId && user.location != undefined)
    ) {
      const selectedButton = ctx.callbackQuery;
      let location = selectedButton.data;
      console.log(selectedButton.data, "selected");

      if (location) {
        let locationExistsInTumanData = tumanData.regions.includes(location);
        console.log(locationExistsInTumanData, "locationExistsInTumanData");

        if (locationExistsInTumanData) {
          // ctx.deleteMessage();
          ctx.editMessageText(
            `<b>Sizning joylashuvingiz: <code>${location}</code> ✅.\nAgar joylashuvingiz oʻzgargan boʻlsa pastdagi tugmani bosgan holda joylashuvingizni oʻzgartirishingiz mumkin.\n\nQaysi kunni taqvimini bilmoqchisiz?\n\nAmalni bekor qilmoqchi bo'lsangiz yoki bot qotib qolsa qaytadan /start bosing.</b>`,
            { parse_mode: "HTML", ...keyboardDateType }
          );

          let newUser = { id: userId, location: location };

          // userId teng bo'lgan obyektni qidirib, bo'lsa yangi obyektni qo'shish
          let existingUserIndex = userIDs.findIndex(
            (user) => user.id === userId
          );
          if (existingUserIndex !== -1) {
            // Agar foydalanuvchi allaqachon mavjud bo'lsa, mavjud obyektni yangilaymiz
            userIDs[existingUserIndex] = newUser;
          } else {
            // Agar foydalanuvchi hali mavjud bo'lmasa, yangi obyektni qo'shamiz
            userIDs.push(newUser);
          }

          // Yangilangan userIDs ni saqlash
          saveUserIds(userIDs);
        }
      }
    }
  } catch (error) {
    console.error("Error in taqvim.on callback_query function:", error);
    ctx.reply("error"); // Xatolikni identifikatsiya qilish yoki foydalanuvchiga xabar berish
  }
});

bot.action("backToTaqvim", (ctx) => {
  try {
    const regions = tumanData.regions; // Tumanlar ro'yxati

    let userId = ctx.from.id;
    let userIDs = loadUserIds();

    if (
      userIDs.some((user) => user.id === userId && user.location === undefined)
    ) {
      // Foydalanuvchi avval tanlagan joylashuvi yo'q
      ctx.deleteMessage();
      ctx.replyWithHTML(
        `<b>Joylashuvingizni tanlang.\n\nAmalni bekor qilmoqchi bo'lsangiz yoki bot qotib qolsa qaytadan /start bosing.</b>`,
        Markup.inlineKeyboard(generateInlineKeyboard(regions), {
          columns: 2,
        }).resize()
      );
    } else {
      ctx.deleteMessage();
      // Foydalanuvchi avval tanlagan joylashuvi bor
      let selectedLocation = userIDs.find(
        (user) => user.id === userId
      ).location;

      ctx.reply(
        `<b>Sizning tanlagan joylashuvingiz: <code>${selectedLocation}</code>.\nAgar joylashuvingiz oʻzgargan boʻlsa pastdagi tugmani bosgan holda joylashuvingizni oʻzgartirishingiz mumkin.\n\nQaysi kunni taqvimini bilmoqchisiz?\n\nAmalni bekor qilmoqchi bo'lsangiz yoki bot qotib qolsa qaytadan /start bosing.</b>`,
        { parse_mode: "HTML", ...keyboardDateType } // Tugmalarni chiqarish uchun klaviatura
      );
    }
  } catch (error) {
    console.error("Error in bot.action backToTaqvim function:", error);
    ctx.reply("error"); // Xatolikni identifikatsiya qilish yoki foydalanuvchiga xabar berish
  }
});

bot.action("bugunData", async (ctx) => {
  try {
    let userIDs = await loadUserIds();
    let userId = ctx.from.id;
    let location = userIDs.find((user) => user.id === userId)?.location;

    let user = userIDs.find((user) => user.id === userId);

    if (!user || !user.location) {
      return ctx.reply("Iltimos, avval joylashuvingizni belgilang.");
    }

    console.log(location, "location: " + userId, "userId: ");

    ctx.deleteMessage();
    let data = await getIslamicData(location);
    console.log(data, "data ");
    let date = data.date;
    let hijriDate = data.hijri_date;
    let sahar = data.times.tong_saharlik;
    let quyosh = data.times.quyosh;
    let peshin = data.times.peshin;
    let asr = data.times.asr;
    let shom = data.times.shom_iftor;
    let hufton = data.times.hufton;

    const shareButton = {
      text: "Ulashish ⬆",
      switch_inline_query: `- orqali Namoz vaqtlarini bilib olishingiz mumkin.\n\n⏺ Bugun ${date} Ramazon oyining ${hijriDate.day}-kuni. \n🕌 ${location} shaxrining namoz vaqtlari:\n🕋 Bomdod: ${sahar}\n🌄 Quyosh: ${quyosh}\n🏙️ Peshin: ${peshin}\n🌇 Asr: ${asr}\n🌉 Shom: ${shom}\n🌃 Xufton: ${hufton}`,
    };

    const buttonB = {
      text: "Ortga ↪️",
      callback_data: "backToTaqvim",
    };

    const replyMarkup = {
      inline_keyboard: [[shareButton, buttonB]],
    };

    ctx.reply(
      `<b>⏺ Bugun ${date} Ramazon oyining ${hijriDate.day}-kuni. \n🕌 ${location} shaxrining namoz vaqtlari:\n
🕋 Tong (saharlik): ${sahar}
🌄 Quyosh: ${quyosh}
🏙️ Peshin: ${peshin}
🌇 Asr: ${asr}
🌉 Shom (iftorlik): ${shom}
🌃 Xufton: ${hufton}\n\n@${botUser} - orqali Ramazon taqvimini telegram bot orqali osson bilib olishingiz mumkin.</b>`,
      { parse_mode: "HTML", reply_markup: replyMarkup }
    );
  } catch (error) {
    console.error("Error in bot.action bugunData function:", error);
    ctx.reply("error"); // Xatolikni identifikatsiya qilish yoki foydalanuvchiga xabar berish
  }
});

//send
bot.action("haftalikData", async (ctx) => {
  try {
    ctx.deleteMessage();
    let userIDs = await loadUserIds();
    let userId = ctx.from.id;
    let user = userIDs.find((user) => user.id === userId);
    let location = user?.location;

    if (!user || !location) {
      return ctx.reply("Iltimos, avval joylashuvingizni belgilang.");
    }

    console.log(location, "location: " + userId, "userId: ");

    let replyMessage = "*🕌 Namoz vaqtlari:* \n\n";

    // Await the result of getIslamicHafta()
    let islamicHaftaData = await getIslamicHafta(location);

    for (let data of islamicHaftaData) {
      let date = data.date.split(" ")[0];
      let hijriDate = data.hijri_date;
      let weekday = data.weekday;
      let sahar = data.times.tong_saharlik;
      let quyosh = data.times.quyosh;
      let peshin = data.times.peshin;
      let asr = data.times.asr;
      let shom = data.times.shom_iftor;
      let hufton = data.times.hufton;

      replyMessage += `*⏺ ${date} ${weekday} Ramazon oyining ${hijriDate.day}-kuni.* \n`;
      replyMessage += `*🕋 Tong (saharlik): ${sahar}* \n`;
      replyMessage += `*🌄 Quyosh: ${quyosh}* \n`;
      replyMessage += `*🏙️ Peshin: ${peshin}* \n`;
      replyMessage += `*🌇 Asr: ${asr}* \n`;
      replyMessage += `*🌉 Shom (iftorlik): ${shom}* \n`;
      replyMessage += `*🌃 Xufton: ${hufton}* \n\n`;
    }

    const shareButton = {
      text: "Ulashish ⬆",
      switch_inline_query: ` - orqali Namoz vaqtlarini bilib olishingiz mumkin.\n\n${replyMessage}`,
    };

    const buttonB = {
      text: "Ortga ↪️",
      callback_data: "backToTaqvim",
    };

    const replyMarkup = {
      inline_keyboard: [[shareButton, buttonB]],
    };

    ctx.reply(replyMessage, {
      parse_mode: "Markdown",
      reply_markup: replyMarkup,
    });
  } catch (error) {
    console.error("Error:", error);
    ctx.reply("error"); // Xatolikni identifikatsiya qilish yoki foydalanuvchiga xabar berish
  }
});

bot.action("qollanma", (ctx) => {
  try {
    ctx.deleteMessage();
    ctx.reply(
      `<b>Video qo'llanmani ko'rish uchun <a href="https://t.me/BayramonaTabrik/722">bu yerga</a> bosing. </b>`,
      { disable_web_page_preview: true, parse_mode: "HTML", ...keyboardrestart }
    );
  } catch (error) {
    console.error("Error in bot.action qollanma function:", error);
    ctx.reply("error");
  }
});

//restartbot

bot.action("ramadanduo", (ctx) => {
  try {
    ctx.deleteMessage();
    ctx.reply(
      "<b>Oʻzingiz kerakli tugmani tanlab foydalanishingiz mumkin. \n\nAmalni bekor qilmoqchi bo'lsangiz yoki bot qotib qolsa qaytadan /start bosing.</b>",
      {
        parse_mode: "HTML",
        ...keyboardDuoType,
      }
    );
  } catch (error) {
    console.error("Error in bot.action ramadanduo function:", error);
    ctx.reply("error"); // Xatolikni identifikatsiya qilish yoki foydalanuvchiga xabar berish
  }
});

bot.action("backToDuo", (ctx) => {
  try {
    ctx.deleteMessage();
    ctx.reply(
      "<b>Oʻzingiz kerakli tugmani tanlab foydalanishingiz mumkin.\n\nAmalni bekor qilmoqchi bo'lsangiz yoki bot qotib qolsa qaytadan /start bosing.</b>",
      {
        parse_mode: "HTML",
        ...keyboardDuoType,
      }
    );
  } catch (error) {
    console.error("Error in bot.action backToDuo function:", error);
    ctx.reply("error"); // Xatolikni identifikatsiya qilish yoki foydalanuvchiga xabar berish
  }
});

bot.action("sahar", (ctx) => {
  try {
    ctx.deleteMessage();

    ctx.reply(
      `<b>Saharlik (og‘iz yopish) duosi: \n\nNavaytu an asuma sovma shahri Ramazona minal fajri ilal mag‘ribi, xolisan lillahi ta’ala. Allohu akbar! \nYa’ni, Ramazon oyining ro‘zasini tong otgandan kun botgunigacha xolis Alloh uchun tutishni niyat qildim. Allohu akbar.\n\n@${botUser} - orqali Ramazon taqvimini telegram bot orqali osson bilib olishingiz mumkin.</b>`,
      { parse_mode: "HTML", ...keyboardBackToDuo }
    );
  } catch (error) {
    console.error("Error in bot.action sahar function:", error);
    ctx.reply("error"); // Xatolikni identifikatsiya qilish yoki foydalanuvchiga xabar berish
  }
});

bot.action("iftor", (ctx) => {
  try {
    ctx.deleteMessage();

    ctx.reply(
      `<b>Iftorlik (og‘iz ochish) duosi:\n\nAllohumma laka sumtu va bika amantu va a’alayka tavakkaltu va ’ala rizqika aftartu, fag‘firli, ya G‘offaru, ma qoddamtu vama axxortu.\nYa’ni, Yo Alloh, Senga imon keltirib, Senga tavakkal qilib, Sen uchun ro‘za tutdim. Sen bergan rizq bilan iftor qildim. Ey gunohlarni kechirguvchi Zot, Oldingi va keyingi gunohlarimni kechir. Omin!\n\n@${botUser} - orqali Ramazon taqvimini telegram bot orqali osson bilib olishingiz mumkin.</b>`,
      { parse_mode: "HTML", ...keyboardBackToDuo }
    );
  } catch (error) {
    console.error("Error in bot.action iftor function:", error);
    ctx.reply("error"); // Xatolikni identifikatsiya qilish yoki foydalanuvchiga xabar berish
  }
});

bot.action("taroveh", (ctx) => {
  try {
    ctx.deleteMessage();
    ctx.reply(
      `<b>TAROVЕH TASBЕHI\n- - - - - - - - - - - - - - - - - -\n📖 - Subhaana zil mulki val malakut. Subhaana zil ’izzati val ’azomati val qudroti val kibriyai val jabarut. Subhaanal malikil hayyillaziy laa yanaamu va laa yamut. Subbuhun quddusur Robbunaa va Robbul malaaikati var Ruh. Laa ilaaha illallohu nastag‘firulloh. Nas'alukal jannata va na’uzu bika minan nar.\n\n@${botUser} - orqali Ramazon taqvimini telegram bot orqali osson bilib olishingiz mumkin.</b>`,
      { parse_mode: "HTML", ...keyboardBackToDuo }
    );
  } catch (error) {
    console.error("Error in bot.action taroveh function:", error);
    ctx.reply("error"); // Xatolikni identifikatsiya qilish yoki foydalanuvchiga xabar berish
  }
});

function createInlineButton(number) {
  return {
    text: number.toString(),
    callback_data: `select_${number}`,
  };
}

// Register the scene with Telegraf

const stage = new Scenes.Stage([
  taklifScene,
  tabrikYollashScene,
  createCertificateScene,
  taqvim,
]);

bot.use(session());
bot.use(stage.middleware());

// keyboards start
const keyboardReject = {
  reply_markup: {
    inline_keyboard: [[{ text: "❌ Bekor qilish", callback_data: "reject" }]],
  },
};

const keyboardrestart = {
  reply_markup: {
    inline_keyboard: [[{ text: "🔄", callback_data: "restartBot" }]],
  },
};

const keyboardCheckReject = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "✅ Tasdiqlash", callback_data: "check" }],
      [{ text: "❌ Bekor qilish", callback_data: "reject" }],
      [{ text: "🔄 Qayta joʻnatish", callback_data: "restarted" }],
    ],
  },
};
//ortga

const keyboardAdminCheckReject = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "✅ Tasdiqlash", callback_data: "approveTabrik" }],
      [{ text: "❌ Bekor qilish", callback_data: "bekoreTabrik" }],
      [{ text: "🔄 Qayta joʻnatish", callback_data: "restarted" }],
    ],
  },
};

const keyboardTaklifCheck = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "❌ Bekor qilish", callback_data: "rejectTaklif" }],
      // [{ text: "🔄 Qayta joʻnatish", callback_data: "restartedToTaklif" }],
    ],
  },
};

const keyboardTabrikYollash = {
  reply_markup: {
    inline_keyboard: [
      // [
      //   { text: "🥹 Ramazonni hisoblash", callback_data: "calculateramadan" },

      //   // {
      //   //   text: "📃 Sertifikat tayyorlash",
      //   //   callback_data: "createCertificate",
      //   // },
      // ],
      // [
      //   { text: "📃Taqvim", callback_data: "taqvim" },
      //   { text: "🤲 Duolar", callback_data: "ramadanduo" },
      // ],

      [{ text: "📖 Tabrik Yoʻllash", callback_data: "tabrik_yollash" }],
      // [{ text: "🕋 Qur'on", callback_data: "quron" }],

      [
        { text: "🤖Bot haqida", callback_data: "botHaqida" },

        { text: "⭐️Taklif Yuborish", callback_data: "taklifYuborish" },
      ],
      // [{ text: "📹Video qoʻllanma", callback_data: "qollanma" }],
      // [

      // ],
    ],
  },
};

const keyboardBackToDuo = {
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "Ortga ↪️",
          callback_data: "backToDuo",
        },
        {
          text: "🔄",
          callback_data: "restartBot",
        },
      ],
    ],
  },
};

// send

const keyboardDuoType = {
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "🤲 Saharlik duosi",
          callback_data: `sahar`,
        },
        {
          text: "🤲 Iftorlik duosi",
          callback_data: `iftor`,
        },
      ],
      [
        {
          text: "🔘 Taroveh tasbehi",
          callback_data: `taroveh`,
        },
      ],
      [
        {
          text: "Ortga ↪️",
          callback_data: "restartBot",
        },
      ],
    ],
  },
};

const keyboardTabrikLink = {
  reply_markup: {
    inline_keyboard: [
      // [{ text: "📃Ramazon taqvimi", url: `https://t.me/${botUser}` }],
      [{ text: "📖 Tabrik Yoʻllash", url: `https://t.me/${botUser}` }],

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
      // [],
      // [
      //   {
      //     text: "🇸🇦Arab tilini oʻrganamiz",
      //     url: `https://t.me/${channelUser5}`,
      //   },
      // ],
    ],
  },
};

const keyboardAdminHelpLink = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "🔄 Qayta ishga tushirish", callback_data: "restartBot" }],
      [{ text: "👨‍💻Adminstrator", url: `https://t.me/${adminUser}` }],
      [
        {
          text: "🎉Bayramona Tabriklar ",
          url: `https://t.me/${channelUser}`,
        },
      ],

      [
        {
          text: "📔 Iqtiboslar",
          url: `https://t.me/${channelUser2}`,
        },
        {
          text: "📘 Tarix",
          url: `https://t.me/${channelUser3}`,
        },
        // {
        //   text: "📘KibrUz",
        //   url: `https://t.me/${channelUser4}`,
        // },
      ],
      // [
      //   {
      //     text: "🇸🇦Arab tilini oʻrganamiz",
      //     url: `https://t.me/${channelUser5}`,
      //   },
      // ],
      [
        {
          text: "Instagram",
          url: `https://${instagramUser}`,
        },
        {
          text: "YouTube",
          url: `https://${youtubeUser}`,
        },
      ],
      [
        {
          text: "X (Twitter)",
          url: `https://${twitterUser}`,
        },
        {
          text: " UmmaLife",
          url: `https://ummalife.com/Saidqodiriy`,
        },
      ],
    ],
  },
};

const keyboardAdminLink = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "👨‍💻Adminstrator", url: `https://t.me/${adminUser}` }],
      [
        {
          text: "🎉Bayramona Tabriklar ",
          url: `https://t.me/${channelUser}`,
        },
      ],

      [
        {
          text: "📔 Iqtiboslar",
          url: `https://t.me/${channelUser2}`,
        },
        {
          text: "📘 Tarix",
          url: `https://t.me/${channelUser3}`,
        },
        // {
        //   text: "📘KibrUz",
        //   url: `https://t.me/${channelUser4}`,
        // },
      ],
    ],
  },
};

const keyboardMajburiyAzo = {
  reply_markup: {
    inline_keyboard: [
      // [
      //   {
      //     text: "🇸🇦 Arab tilini o'rganamiz",
      //     // text: "➕ Aʻzo boʻlish [*]",
      //     url: `https://t.me/${channelUser5}`,
      //   },

      //   // ➕ Aʻzo boʻlish
      // ],
      [
        {
          text: "📚 Iqtiboslar",
          url: `https://t.me/${channelUser4}`,
        },
      ],
      [
        {
          text: "🎉Bayramona Tabriklar ",
          url: `https://t.me/${channelUser}`,
        },
        {
          text: "📘 Tarix",
          url: `https://t.me/${channelUser3}`,
        },
      ],
      [
        // [
        //   {
        //     text: "🇰🇷 Koreys tilini o'rganamiz",
        //     url: `https://t.me/${channelUser6}`,
        //   },
        // ],
        // [
        //   {
        //     text: "📓 BLOG [-]",
        //     url: `https://t.me/${channelUser2}`,
        //   },
        //   {
        //     text: "👨‍💻 IT BLOG [-]",
        //     url: `https://t.me/${channelUser3}`,
        //   },
        // ],

        { text: "✅ Tekshirish", callback_data: "checkMajburiy" },
      ],
    ],
  },
};

// start

const keyboardDateType = {
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "🫶 Bugun",
          callback_data: `bugunData`,
        },
        {
          text: "📔 Haftalik",
          callback_data: `haftalikData`,
        },
      ],
      [
        // {
        //   text: "📑 Oylik",
        //   callback_data: `oylikData`,
        // },
      ],
      [
        {
          text: "❇️ Joylashuvni qayta belgilash",
          callback_data: "TUMAN_QAYTA_TANLASH",
        },
      ],
      [
        // { text: "Ortga ↪️", callback_data: "tabrikYollash" },
        {
          text: "Ortga ↪️",
          callback_data: "tabrikYollash",
        },
      ],
    ],
  },
};

let keyboardLocation = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "❇️ Joylashuvni belgilash", callback_data: "TUMAN_TANLASH" }],
      // [
      //   { text: "🔄", callback_data: "restartBot" },
      //   { text: "❌ Bekor qilish", callback_data: "reject" },
      // ],
    ],
  },
};
//keyboards end taqvim

// User ID saved start
function saveUserIds(userIds) {
  fs.writeFileSync("user_ids.json", JSON.stringify(userIds, null, 2), "utf8");
}

// Function to load user IDs from the JSON file
function loadUserIds() {
  if (fs.existsSync("user_ids.json")) {
    const data = fs.readFileSync("user_ids.json", "utf8");
    return JSON.parse(data);
  }
  return [];
}

// User ID saved end

// congrats json file start

const congratsFilePath = "congrats.json";

// Function to save data to JSON file
function saveDataToJSON(data) {
  fs.writeFileSync(congratsFilePath, JSON.stringify(data, null, 2));
}

// Function to load data from JSON file
function loadDataFromJSON() {
  try {
    const data = fs.readFileSync(congratsFilePath);
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

bot.use((ctx, next) => {
  ctx.session.pendingMessage = null;
  return next();
});

function markMessageAsApproved(messageData) {
  const congratsData = loadDataFromJSON();
  const index = congratsData.findIndex(
    (entry) => entry.message === messageData.message
  );

  if (index !== -1) {
    congratsData[index].approved = true;
    saveDataToJSON(congratsData);
  } else {
    congratsData[index].approved = true;
    saveDataToJSON(congratsData);
  }
}

// congrats JSON file end

async function sendToAllUsers(messageText) {
  const userIDs = loadUserIds();

  for (let i = 0; i < userIDs.length; i++) {
    const userId = userIDs[i].id; // Foydalanuvchi IDsi

    console.log(userId, "USERID");
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Botning ko'chirilayotgan xabarlari
      await bot.telegram.sendMessage(userId, messageText);
    } catch (error) {
      console.error(
        `Foydalanuvchiga xabar yuborishda xatolik yuz berdi: ${userId}: ${error}`
      );
    }
  }
}

function isAdminUser(ctx) {
  console.log(ctx.message.from.id);
  return ctx.message.from.id == adminId;
}

async function getIslamicData(region) {
  try {
    const response = await axios.get(
      `${ISLOM_API_LINK}/present/day?region=${region}`
    );
    console.log(`${ISLOM_API_LINK}/present/day?region=${region}`, "URL");
    const data = response.data;
    return data;
  } catch (error) {
    console.log("Xatolik yuz berdi: ", error);
  }
}

async function getIslamicHafta(region) {
  try {
    const response = await axios.get(
      `${ISLOM_API_LINK}/present/week?region=${region}`
    );
    const data = response.data;
    return data;
  } catch (error) {
    console.log("Xatolik yuz berdi: ", error);
    throw error; // Re-throw the error so it can be caught by the caller
  }
}

async function getIslamicMonth(region) {
  try {
    const response = await axios.get(
      `${ISLOM_API_LINK}/monthly?region=${region}`
    );
    const data = response.data;
    return data;
  } catch (error) {
    console.log("Xatolik yuz berdi: ", error);
  }
}

// dan yangi

bot.command("start", async (ctx) => {
  try {
    //reject
    ctx.scene.leave();

    const userId = ctx.message.from.id;
    let name = ctx.message.from.first_name;
    let username = ctx.message.from.username;

    const member = await ctx.telegram.getChatMember(channelId, userId);
    const member2 = await ctx.telegram.getChatMember(channelId2, userId);
    // const member3 = await ctx.telegram.getChatMember(channelId3, userId);
    // const member4 = await ctx.telegram.getChatMember(channelId4, userId);
    // User ID-larni yuklab olish
    let userIDs = loadUserIds();
    let userIDlen = userIDs.length;

    // Agar user ID ro'yxatda yo'q bo'lsa, unga qo'shamiz
    if (!userIDs.some((user) => user.id === userId)) {
      userIDs.push({ id: userId });
      saveUserIds(userIDs); // Yangilangan user ID-larni saqlash

      ctx.telegram.sendMessage(
        adminId,
        `🆕[${
          userIDlen + 1
        }] Yangi foydalanuvchi \n🆔: <code>${userId}</code>\n✳️ ${name}\n❇️ @${
          username === undefined ? "" : username
        }`,
        { parse_mode: "HTML" }
      );
    }

    ctx.session.userId = userId;
    ctx.session.memberId = member;
    ctx.session.memberId2 = member2;
    // ctx.session.memberId3 = member3;
    // ctx.session.memberId3 = member4;

    // Agar foydalanuvchi kanal a'zosi bo'lsa yoki admin bo'lsa
    if (
      member.status === "member" &&
      member2.status === "member"
      // member3.status === "member" &&
      // member4.status === "member"
    ) {
      ctx.reply(
        `<b>Assalomu Alaykum, <a href="t.me/bayramonatabrik">Bayramona Tabriklar</a> loyihasining botiga xush kelibsiz! \nBotni ishlatish uchun pastdagi tugmalardan foydalaning 👇 </b`,
        {
          disable_web_page_preview: true,
          parse_mode: "HTML",
          ...keyboardTabrikYollash,
        }
      );
    } else {
      ctx.reply(
        `<b>Assalomu Alaykum, <a href="t.me/bayramonatabrik">Bayramona Tabriklar</a> loyihasining botiga xush kelibsiz! \nBotdan Toʻliq foydalanish uchun pastdagi majburiy kanallarga aʻzo boʻling👇\n\nKanallar bu bizning #tirikchilik imizdir toʻgʻri tushunasiz degan umiddaman😉.</b>`,
        {
          disable_web_page_preview: true,
          parse_mode: "HTML",
          ...keyboardMajburiyAzo,
        }
      );
    }
  } catch (error) {
    console.error("Error in start command:", error);
    // Handle the error here, e.g., log it or send a message to the user
  }
});

bot.action("taklifYuborish", async (ctx) => {
  try {
    // Delete the triggering message
    await ctx.deleteMessage();

    // Reply with a message prompting the user to submit their suggestion
    await ctx.reply("Taklifingizni yuboring", keyboardTaklifCheck);

    // Enter the scene for handling the suggestion
    ctx.scene.enter("taklifScene");
  } catch (error) {
    console.error("Error in taklifYuborish action:", error);
    // Handle the error here, e.g., log it or send a message to the user
  }
});

bot.command("dev", (ctx) => {
  try {
    ctx.scene.leave();
    ctx.reply(`Dasturchi: @${adminUser}`);
  } catch (error) {
    console.error("Error in dev command:");
  }
});

bot.action("botHaqida", (ctx) => {
  try {
    ctx.deleteMessage(); // Delete the message that triggered the action
    ctx.reply(
      `<b>Dasturchi va muallif: Saidqodirxon Rahimov ibn Abdullo\nBot vazifasi: ushbu bot yordamida siz @${channelUser} kanaliga oʻz tabrigingizni joʻnatishingiz mumkin.\n\n#tirikchilik istalgan turdagi web-sayt va telegram botlar yasab beriladi <a href="https://t.me/alCODERSUZ/4">batafsil bu yerda</a>.\nIjtimoiy tarmoqlarda👇</b>`,
      {
        disable_web_page_preview: true,
        parse_mode: "HTML",
        ...keyboardAdminHelpLink,
      }
    );
  } catch (error) {
    console.error("Error in bot.action botHaqida function:", error);
    ctx.reply("error"); // Xatolikni identifikatsiya qilish yoki foydalanuvchiga xabar berish
  }
});

bot.action("taqvim", (ctx) => {
  try {
    ctx.scene.enter("taqvim");
  } catch (error) {
    console.error("Error in bot.action taqvim function:", error);
    ctx.reply("error"); // Xatolikni identifikatsiya qilish yoki foydalanuvchiga xabar berish
  }
});

// ctx.reply("TAQVIM", keyboardDateType);
// Xatolik yuz berdi. Qayta urinib koʻring.

//

bot.action("createCertificate", (ctx) => {
  // Start the scene when the ʻcreateCertificateʻ action is triggered
  ctx.scene.enter("createCertificate");
});

//
let updatedMessage = null;
let isAdminInSendMode = false;

bot.command("stat", (ctx) => {
  try {
    ctx.scene.leave();
    const userIDs = loadUserIds();

    if (isAdminUser(ctx)) {
      const totalUsers = userIDs.length;

      const message = `Hozirda foydalanuvchilar soni: ${totalUsers}`;
      ctx.reply(message);
    } else {
      ctx.reply("Siz Admin emassiz");
    }
  } catch (error) {
    console.error("Error in bot.command stat function:", error);
    ctx.reply("error"); // Xatolikni identifikatsiya qilish yoki foydalanuvchiga xabar berish
  }
});

bot.command("admin", (ctx) => {
  try {
    ctx.scene.leave();
    const userIDs = loadUserIds();

    if (isAdminUser(ctx)) {
      const message = `/stat - Statistika\n\n/send - Foydalanuvchilarga xabar yuborish`;
      ctx.reply(message);
    } else {
      ctx.reply("Siz Admin emassiz");
    }
  } catch (error) {
    console.error("Error in bot.command admin function:", error);
    ctx.reply("error"); // Xatolikni identifikatsiya qilish yoki foydalanuvchiga xabar berish
  }
});

bot.command("send", async (ctx) => {
  try {
    ctx.scene.leave();

    if (isAdminUser(ctx)) {
      if (isAdminInSendMode) {
        // If admin is already in "send mode," send the stored message to all users
        if (updatedMessage) {
          sendToAllUsers(updatedMessage);
          await ctx.reply(
            `Xabar barcha foydalanuvchilarga muvaffaqiyatli yuborildi.`
          );
        } else {
          await ctx.reply("Xabar boʻsh");
        }
        // Reset the "send mode" state
        isAdminInSendMode = false;
      } else {
        // If admin is not in "send mode," set the state to "send mode" and ask for the message
        isAdminInSendMode = true;
        await ctx.reply("Iltimos, joʻnatmoqchi boʻlgan xabaringizni yuboring:");
      }
    } else {
      isAdminInSendMode = false;
      await ctx.reply("Siz Admin emassiz");
    }
  } catch (error) {
    console.error("Error in bot.command send function:", error);
    await ctx.reply("Xatolik sodir bo'ldi. Iltimos, qayta urinib ko'ring.");
    // Error during identifying or sending message to the user
  }
});

bot.action("/cancel", async (ctx) => {
  isAdminInSendMode = false;
  await ctx.reply("Xabar yuborish bekor qilindi!");
});

// check
bot.on("text", async (ctx) => {
  try {
    const userIDs = loadUserIds();
    // Check if the admin user is in "send mode"
    if (isAdminInSendMode) {
      // Store the message as updatedMessage
      updatedMessage = ctx.message.text;

      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < userIDs.length; i++) {
        const userId = userIDs[i].id;
        try {
          await ctx.telegram.sendMessage(userId, updatedMessage);
          successCount++;
        } catch (error) {
          console.log(
            `Xabar foydalanuvchiga yuborilmadi: ${userId}\nXato: ${error}`
          );
          failureCount++;
        }
      }

      if (successCount > 0) {
        try {
          await ctx.telegram.sendMessage(
            adminId,
            `Xabar barcha foydalanuvchilarga muvaffaqiyatli yuborildi. Yuborilgan: ${successCount}, Xatolik: ${failureCount}`
          );
        } catch (error) {
          console.log(
            `Xabar admin foydalanuvchiga yuborilmadi: ${adminId}\nXato: ${error}`
          );
        }
      }
    } else {
      const messageText = ctx.message.text.toLowerCase();
      if (!warningWords.includes(messageText)) {
        ctx.reply(
          `Uzr, bu buyruqni tushunmayman. Qayta /start buyrugʻini bering.`
        );
      }
    }
  } catch (error) {
    console.error("Error in bot.on text event:", error);
    ctx.reply("error"); // Xatolikni identifikatsiya qilish yoki foydalanuvchiga xabar berish
  }
});

// left_chat_member

bot.on("left_chat_member", (ctx) => {
  const userId = ctx.message.left_chat_member.id;
  const chatId = ctx.message.from.id;
  const firstName = ctx.message.from.first_name;

  console.log("chiqdi" + " " + firstName);

  console.log("chiqdi" + " " + chatId);

  console.log("chiqdi" + " " + userId);

  ctx.sendMessage(
    chatId,
    `Ushbu ${firstName} foydalanuvchi guruhni tark etdi !`
  );
});

// left_chat_member

bot.action("checkMajburiy", async (ctx) => {
  try {
    // const channelId = "";
    // ctx.deleteMessage();
    const userId = ctx.from.id;

    // Kanalda aʻzo boʻlishni tekshirish
    const isMember = await ctx.telegram
      .getChatMember(channelId, userId)
      .then((chatMember) => {
        return (
          chatMember.status === "member" ||
          chatMember.status === "administrator" ||
          chatMember.status === "creator"
        );
      })
      .catch((error) => {
        ctx.editMessageText(
          "Xatolik, Iltimos, bot. buyrugʻini qayta joʻnatib botni yangilang."
          // keyboardMajburiyAzo
        );

        console.log(
          "Kanal aʻzolik holatini tekshirishda xato yuz berdi:",
          error
        );

        return false;
      });

    if (isMember) {
      ctx.editMessageText(
        `<b>Assalomu alaykum! <a href="t.me/bayramonatabrik">Bayramona Tabriklar</a> loyihasining botiga xush kelibsiz! \nBotni ishlatish uchun quyidagi tugmalardan foydalaning 👇</b>`,
        {
          disable_web_page_preview: true,
          parse_mode: "HTML",
          ...keyboardTabrikYollash,
        }
      );
    } else {
      ctx.answerCbQuery(
        "Botdan toʻliq foydalanish uchun kanalga aʻzo boʻling",
        {
          show_alert: true,
        }
      );
    }
  } catch (error) {
    console.error("Error in bot.action checkMajburiy:", error);
    ctx.reply("error"); // Xatolikni identifikatsiya qilish yoki foydalanuvchiga xabar berish
  }
});

bot.action("tabrik_yollash", (ctx) => {
  try {
    // ctx.deleteMessage();
    originalMessage = ctx.update.callback_query.message; // Store the original message

    // Get the updated tabrik message from the user
    ctx.editMessageText(
      "<b>Tabrik xabaringizni kiriting:\n\n🚫Tabrikingizda imloviy xatolik va nomaqbul (18+) soʻzlar ishlatmang.</b>",
      { parse_mode: "HTML", ...keyboardReject }
    );

    // Save the userʻs chat ID for later use
    ctx.session.userId = ctx.from.id;
    ctx.session.firstName = ctx.from.first_name;
    console.log(ctx.from);

    // Transition to the tabrikYollashScene
    ctx.scene.enter("tabrikYollash");
  } catch (error) {
    console.error("Error in bot.action tabrik_yollash:", error);
    ctx.reply("error"); // Xatolikni identifikatsiya qilish yoki foydalanuvchiga xabar berish
  }
});

bot.action("calculateramadan", async (ctx) => {
  try {
    ctx.deleteMessage();
    const remainingTime = calculateTimeToRamadan(ramadanDate);
    const currentTime = getCurrentTime();

    console.log(currentTime.currentDate);

    const result = calculateTimeToRamadan(ramadanDate);
    console.log(
      `Ramazonga: ${result.remainingDays} kun, ${result.remainingHours} soat, ${result.remainingMinutes} daqiqa, ${result.remainingSeconds} soniya.`
    );

    const htmlMessage = `<b>Ramazonga \n\n📆 ${remainingTime.remainingDays} kun\n⏰ ${remainingTime.remainingHours} soat\n⏱ ${remainingTime.remainingMinutes} daqiqa\n⏳ ${remainingTime.remainingSeconds} soniya qoldi!\n\n------------ Hozirgi vaqt ----------\n\n📆 ${currentTime.currentDate}\n⏰ ${currentTime.currentHours}:${currentTime.currentMinutes}:${currentTime.currentSeconds}\n\n\n@${botUser} - orqali Ramazon taqvimini telegram bot orqali osson bilib olishingiz mumkin.</b>`;

    await ctx.replyWithHTML(htmlMessage, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔁 Vaqtni yangilash", callback_data: "refreshNewData" },
            { text: "🔄", callback_data: "restartBot" },
          ],
        ],
      },
    });
  } catch (error) {
    console.error("Error in bot.action calculateramadan:", error);
    ctx.reply("error"); // Xatolikni identifikatsiya qilish yoki foydalanuvchiga xabar berish
  }
});

bot.action("refreshNewData", async (ctx) => {
  try {
    // Update the message content
    const updatedHtmlMessage = getUpdatedHtmlMessage();

    // Edit the existing message with the updated content
    await ctx.editMessageText(updatedHtmlMessage, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔁 Vaqtni yangilash", callback_data: "refreshNewData" },
            { text: "🔄", callback_data: "restartBot" },
          ],
        ],
      },
    });

    // Send a notification to the user after processing the action
    await ctx.answerCbQuery("Vaqt Yangilandi!");
  } catch (error) {
    console.error("Error in bot.action refreshNewData:", error);
    ctx.reply("error"); // Xatolikni identifikatsiya qilish yoki foydalanuvchiga xabar berish
  }
});

function getUpdatedHtmlMessage() {
  try {
    // Calculate the updated countdown values
    const remainingTime = calculateTimeToRamadan(ramadanDate);
    const currentTime = getCurrentTime();

    // Create the updated HTML message
    const updatedHtmlMessage = `<b>Ramazonga \n\n📆 ${remainingTime.remainingDays} kun\n⏰ ${remainingTime.remainingHours} soat\n⏱ ${remainingTime.remainingMinutes} daqiqa\n⏳ ${remainingTime.remainingSeconds} soniya qoldi!\n\n------------ Hozirgi vaqt ----------\n\n📆 ${currentTime.currentDate}\n⏰ ${currentTime.currentHours}:${currentTime.currentMinutes}:${currentTime.currentSeconds}\n\n\n@${botUser} - orqali Ramazon taqvimini telegram bot orqali osson bilib olishingiz mumkin.</b>`;

    return updatedHtmlMessage;
  } catch (error) {
    console.error("Error in getUpdatedHtmlMessage:", error);
    return "Xatolik yuz berdi. Yangilash muvaffaqiyatsiz tugadi."; // yoki xatolik haqida foydalanuvchiga ma'lumot berish
  }
}

bot.action("check", async (ctx) => {
  try {
    if (pendingMessage) {
      let firstName = ctx.session.firstName;
      let userIds = ctx.session.userIds;

      const messageText = `${firstName} dan yangi tabrik\n\n${pendingMessage}\n\nKanalimiz: @${channelUser}`;
      const messageTextAdmin = `<a href="tg://user?id=${userIds}">${firstName}</a> dan yangi tabrik\n\n${pendingMessage}\n\nKanalimiz: @${channelUser}`;

      // Send tabrik message to the admin
      await ctx.telegram.sendMessage(adminId, messageTextAdmin, {
        parse_mode: "HTML",
        ...keyboardAdminCheckReject,
      });

      const congratsData = loadDataFromJSON();

      const messageData = {
        userId: ctx.session.userIds,
        message: messageText,
        approved: false,
      };
      congratsData.push(messageData);
      saveDataToJSON(congratsData);

      // Ask the admin for approval
      ctx.editMessageText(
        `<b>Tabrikingiz Adminstratorga muvaffaqiyatli yuborildi. \nAgar Adminstrator tomonidan tasdiqlansa kanalimizga joylanadi. \nKanalda kuzatishni davom eting.\n Agar joʻnatmoqchi boʻlgan tabrigingiz juda muhim boʻlsa Adminstrator bilan boʻgʻlaning</b>.`,
        { parse_mode: "HTML", ...keyboardAdminLink }
      );
    } else if (ctx.session.fileId) {
      const fileId = ctx.session.fileId;
      const photo = ctx.session.photo;
      const photoCaption = ctx.session.photoCaption;

      ctx.telegram.sendPhoto(channelId, fileId, {
        caption:
          photoCaption == undefined
            ? ""
            : photoCaption + `\n\n\nTabrik Yoʻllash : @${botUser}`,
      });
      ctx.editMessageText(
        `Tabrikingiz @${channelUser} kanaliga muvaffaqiyatli joylandi.`,
        keyboardrestart
      );
    } else if (ctx.session.videoId) {
      const videoId = ctx.session.videoId;
      const video = ctx.session.video;
      const videoCaption = ctx.session.videoCaption;

      ctx.telegram.sendVideo(channelId, videoId, {
        caption:
          videoCaption == undefined
            ? ""
            : videoCaption + `\n\n\nTabrik Yoʻllash : @${botUser}`,
      });

      ctx.editMessageText(
        `Tabrikingiz @${channelUser} kanaliga muvaffaqiyatli joylandi.`,
        keyboardrestart
      );
    }
    ctx.scene.leave(); // Leave the current scene after processing
  } catch (error) {
    console.error("Error while processing check action:", error);
    return ctx.editMessageText(
      `Joʻnatishda xatolik. Iltimos, qayta urinib koʻring.`,
      keyboardrestart
    );
  }
});

////////

// Action handler for checking and approving messages
bot.action("approveTabrik", async (ctx) => {
  // ctx.deleteMessage();
  // ctx.deleteMessage();
  try {
    const congratsData = loadDataFromJSON();
    const index = congratsData.findIndex((entry) => entry.approved === false);

    console.log(index, "index approve");

    if (index !== -1) {
      // Message is not approved yet

      const messageData = congratsData[index];

      // Send approved message to the channel
      await ctx.telegram.sendMessage(channelId, messageData.message, {
        parse_mode: "HTML",
        ...keyboardTabrikLink,
      });

      ctx.telegram.sendMessage(
        messageData.userId,
        `<b>Sizning xabaringiz maʻqullandi va @${channelUser} kanalga yuborildi !</b>`,
        { parse_mode: "HTML", ...keyboardrestart }
      );

      congratsData[index].approved = true;
      saveDataToJSON(congratsData);

      ctx.answerCbQuery("Muvvafaqiyatli yuborildi", {
        show_alert: true,
      });
    }

    // Reset the pending message
    ctx.session.pendingMessage = null;
  } catch (error) {
    ctx.reply("Xatolik yuz berdi. Iltimos, yana bir bor urinib koʻring.");
  }
});

// bekoreTabrik

bot.action("bekoreTabrik", async (ctx) => {
  try {
    const congratsData = loadDataFromJSON();

    console.log("Bekore Tabrik da ");
    const index = congratsData.findIndex((entry) => entry.approved === false);

    console.log(index, "index");

    if (index !== -1) {
      // Message is not approved yet

      const messageData = congratsData[index];

      // //Send approved message to the channel
      // await ctx.telegram.sendMessage(channelId, messageData.message, {
      //   parse_mode: "HTML",
      //   ...keyboardTabrikLink,
      // });

      console.log(messageData, "message data");

      ctx.telegram.sendMessage(
        messageData.userId,
        `<b>Sizning xabaringiz maʻqullanmadi, Xabaringizni tekshiring nomaqbul (18+) soʻzlar , va imloga eʻtibor bergan holda qayta yuborishingiz mumkin !</b>`,
        { parse_mode: "HTML", ...keyboardrestart }
      );

      congratsData[index].approved = true;
      saveDataToJSON(congratsData);

      ctx.answerCbQuery("Muvvafaqiyatli bekor qilindi", {
        show_alert: true,
      });
    }

    // Reset the pending message
    ctx.session.pendingMessage = null;
  } catch (error) {
    ctx.reply("Xatolik yuz berdi. Iltimos, yana bir bor urinib koʻring.");
  }
});

/////////// ixtiyoriy
bot.action("restarted", (ctx) => {
  // Leave the current scene (if any)
  // ctx.deleteMessage();
  ctx.scene.leave();

  // Enter the "tabrikYollash" scene
  ctx.scene.enter("tabrikYollash");

  // Prompt the user to send a new tabrik message
  ctx.editMessageText("Tabrik xabaringizni qayta kiriting:", keyboardReject);
});

// Taklif yuborish bekor qilindi.

bot.action("restartedToTaklif", (ctx) => {
  // Leave the current scene (if any)
  ctx.scene.leave();

  // Enter the "tabrikYollash" scene
  ctx.scene.enter("tabrikYollash");

  // Prompt the user to send a new tabrik message
  ctx.editMessageText("Taklifingizni qayta kiriting:", keyboardReject);
});

bot.action("reject", (ctx) => {
  ctx.editMessageText(
    "<b>Botni ishlatish uchun pastdagi tugmalardan foydalaning 👇</b>",
    { parse_mode: "HTML", ...keyboardTabrikYollash }
  );
  ctx.scene.leave();
});

bot.action("restartBot", (ctx) => {
  ctx.scene.leave();
  ctx.editMessageText(
    `<b>Assalomu Alaykum, <a href="t.me/bayramonatabrik">Bayramona Tabriklar</a> loyihasining botiga xush kelibsiz! \nBotni ishlatish uchun pastdagi tugmalardan foydalaning 👇</b>`,
    {
      disable_web_page_preview: true,
      parse_mode: "HTML",
      ...keyboardTabrikYollash,
    }
  );
});

const warningWords = ["bot.", "/help", "/dev", "/stat", "/send", "/admin"];

bot.on("text", (ctx) => {
  const messageText = ctx.message.text.toLowerCase();
  if (!warningWords.includes(messageText)) {
    ctx.reply(`Uzr, bu buyruqni tushunmayman. Qayta /start buyrugʻini bering.`);
  }
});

bot.launch();
console.log("Ishladi");
