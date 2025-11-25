const mongoose = require("mongoose");
require("dotenv/config");
const Admin = require("./models/Admin");

async function seedAdmin() {
  try {
    // MongoDB'ga ulanish
    await mongoose.connect(process.env.DB_URL, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB'ga ulandi");

    // Mavjud admin tekshirish
    const existingAdmin = await Admin.findOne({ login: "admin" });

    if (existingAdmin) {
      console.log("⚠️  Admin allaqachon mavjud!");
      console.log("Login:", existingAdmin.login);
      console.log("User ID:", existingAdmin.userId);
      console.log("Role:", existingAdmin.role);

      // Passwordni yangilash (agar kerak bo'lsa)
      const updatePassword = process.argv.includes("--update-password");
      if (updatePassword) {
        existingAdmin.password = "admin";
        await existingAdmin.save();
        console.log("✅ Password yangilandi!");
      }

      await mongoose.connection.close();
      return;
    }

    // Yangi admin yaratish
    const adminData = {
      userId: parseInt(process.env.ADMIN_ID) || 1551855614,
      login: "admin",
      password: "admin", // pre-save hook avtomatik hash qiladi
      firstName: "Admin",
      lastName: null,
      username: process.env.ADMIN_USER || "Admin",
      role: "superadmin",
      permissions: {
        canApprove: true,
        canBlock: true,
        canBroadcast: true,
        canManageChannels: true,
        canManageAdmins: true,
        canManageTemplates: true,
      },
      isActive: true,
      lastLogin: null,
      addedBy: null,
    };

    const admin = new Admin(adminData);
    await admin.save();

    console.log("\n✅ Admin muvaffaqiyatli yaratildi!");
    console.log("═══════════════════════════════════");
    console.log("Login:    admin");
    console.log("Password: admin");
    console.log("Role:     superadmin");
    console.log("User ID: ", adminData.userId);
    console.log("═══════════════════════════════════");
    console.log("\nAdmin Panel: http://localhost:5173/login");
    console.log("\n⚠️  MUHIM: Production'da passwordni o'zgartiring!");

    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ Xatolik:", error.message);
    process.exit(1);
  }
}

// Skriptni ishga tushirish
seedAdmin();
