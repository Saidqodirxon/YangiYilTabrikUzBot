const mongoose = require("mongoose");
const Admin = require("./models/Admin");
require("dotenv/config");

(async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    const admin = await Admin.findOne({ login: "admin" });
    console.log("Admin topildi:", admin ? "HA" : "YOQ");
    if (admin) {
      console.log("Login:", admin.login);
      console.log("Role:", admin.role);
      console.log("UserId:", admin.userId);
      console.log("Password hash bor:", !!admin.password);
      console.log("isActive:", admin.isActive);
    } else {
      console.log("Admin topilmadi! Seed qilish kerak.");
    }
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Xatolik:", error.message);
    process.exit(1);
  }
})();
