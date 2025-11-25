const mongoose = require("mongoose");
require("dotenv/config");

module.exports = async function () {
  try {
    mongoose.set("strictQuery", false);

    await mongoose.connect(process.env.DB_URL, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ MongoDB'ga muvaffaqiyatli ulandi.");
  } catch (err) {
    console.log("⚠️  MongoDB'ga ulanishda xatolik:", err.message);
    console.log("ℹ️  Bot MongoDB'siz ishlaydi (ma'lumotlar saqlanmaydi)");
  }
};
