const mongoose = require("mongoose");
const Admin = require("./models/Admin");
require("dotenv/config");

(async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    const admin = await Admin.findOne({ login: "admin" });

    if (admin) {
      const isMatch = await admin.comparePassword("admin");
      console.log('Password "admin" mos keldi:', isMatch);

      if (!isMatch) {
        console.log("\nPassword yangilanmoqda...");
        admin.password = "admin";
        await admin.save();
        console.log("Password yangilandi!");
      }
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Xatolik:", error.message);
    process.exit(1);
  }
})();
