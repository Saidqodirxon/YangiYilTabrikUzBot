# 👥 Admin Tizimi - Yangilanish v2.0

## ✨ Qo'shilgan Yangiliklar

### 1. Admin Modeli

- MongoDB'da `admins` kolleksiyasi
- Role-based permissions system
- 3 ta rol: superadmin, admin, moderator

### 2. Admin CRUD API

```javascript
GET    /api/admins              // Barcha adminlar
POST   /api/admins              // Yangi admin qo'shish (faqat superadmin)
PUT    /api/admins/:id          // Admin tahrirlash (faqat superadmin)
DELETE /api/admins/:id          // Admin o'chirish (faqat superadmin)
GET    /api/admins/check/:id    // Admin tekshirish
```

### 3. Admin Panel - Admins Sahifasi

**Path:** `http://localhost:5173/admins`

**Funksiyalar:**

- ✅ Barcha adminlar ro'yxati
- ✅ Admin qo'shish modal (userId, firstName, role, permissions)
- ✅ Admin tahrirlash modal
- ✅ Admin o'chirish
- ✅ Rol badge'lari (Superadmin/Admin/Moderator)
- ✅ Permissions ko'rsatish (emoji badge'lar)

**Form Fields:**

- Telegram User ID (majburiy)
- Ism (majburiy)
- Familiya (ixtiyoriy)
- Username (ixtiyoriy)
- Rol (select: superadmin/admin/moderator)
- Huquqlar (6 ta checkbox):
  - ✅ Tabriklarni tasdiqlash
  - 🚫 Userlarni bloklash
  - 📢 Xabar yuborish
  - 📺 Kanallarni boshqarish
  - 👥 Adminlarni boshqarish
  - 🎨 Shablonlarni boshqarish

### 4. Admin Guruhi Integratsiyasi

`.env` fayl:

```env
ADMIN_GROUP_ID=-1003317466562
```

**Workflow:**

1. User tabrik yuboradi
2. Bot admin guruhiga yuboradi (inline buttons bilan)
3. Admin guruhda "✅ Tasdiqlash" yoki "❌ Rad etish" bosadi
4. Bot xabarni edit qiladi: "Tasdiqlangan: @admin_username"
5. Kanal va userga xabar yuboriladi

### 5. Bot'da Admin Tekshiruvi

```javascript
async function isAdmin(userId) {
  // 1. .env'dagi ADMIN_ID
  if (parseInt(userId) === adminId) return true;

  // 2. MongoDB'dagi admins
  const admin = await getAdmin(userId);
  return !!admin;
}
```

### 6. Permissions System

**checkAdminPermission(userId, permission)**

Permissions:

- `canApprove` - Tabriklarni tasdiqlash
- `canBlock` - Userlarni bloklash
- `canBroadcast` - Broadcast yuborish
- `canManageChannels` - Kanallarni boshqarish
- `canManageAdmins` - Adminlarni boshqarish (faqat superadmin)
- `canManageTemplates` - Shablonlarni boshqarish

**Note:** Superadmin barcha huquqlarga avtomatik ega!

## 🚀 O'rnatish

### 1. MongoDB'da Birinchi Superadmin Yaratish

```javascript
use bayramonatabrikbot

db.admins.insertOne({
  userId: 1551855614,  // O'zingizning Telegram User ID
  firstName: "Saidqodirxon",
  lastName: null,
  username: "Saidqodirxon",
  role: "superadmin",
  permissions: {
    canApprove: true,
    canBlock: true,
    canBroadcast: true,
    canManageChannels: true,
    canManageAdmins: true,
    canManageTemplates: true
  },
  isActive: true,
  lastLogin: null,
  addedBy: null,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### 2. .env Sozlash

```env
ADMIN_GROUP_ID=-1003317466562  # Admin guruh ID
```

Guruh ID olish:

1. Botni guruhga admin qiling
2. Guruhda /start yuboring
3. Konsolda guruh ID ko'rinadi

### 3. Botni Qayta Ishga Tushirish

```bash
node bot.js
```

### 4. Admin Panel Yangilanishi

Admin panel avtomatik yangilanadi (Vite HMR)

## 📱 Foydalanish

### Admin Qo'shish (Panel Orqali)

1. http://localhost:5173/admins ga kiring
2. "➕ Yangi Admin" tugmasini bosing
3. Ma'lumotlarni to'ldiring:
   - User ID (Telegram'dan olinadi)
   - Ism, familiya, username
   - Rol tanlang
   - Huquqlarni checkbox'lar bilan belgilang
4. "Qo'shish" bosing

### Tabrikni Tasdiqlash (Guruh Orqali)

1. Admin guruhida yangi tabrik paydo bo'ladi
2. Xabar ostida 2 ta tugma:
   - ✅ Tasdiqlash
   - ❌ Rad etish
3. Tugmani bosganingizda:
   - Xabar edit bo'ladi
   - User va kanal'ga xabar yuboriladi
   - Kim tasdiqlagan ko'rinadi

## 🔐 Xavfsizlik

### Role Hierarchy

```
Superadmin > Admin > Moderator
```

### API Protection

- Faqat superadmin adminlarni boshqarishi mumkin
- Admin o'zini o'chira olmaydi
- Barcha API'lar JWT token bilan himoyalangan

### Admin Group Security

- Faqat adminlar callback tugmalarni bosa oladi
- Non-admin'lar uchun "❌ Ruxsat yo'q!" xabari

## 📊 Admin Model Schema

```javascript
{
  userId: Number,           // Telegram User ID
  firstName: String,        // Ism
  lastName: String,         // Familiya
  username: String,         // @username
  role: String,             // superadmin | admin | moderator
  permissions: {
    canApprove: Boolean,
    canBlock: Boolean,
    canBroadcast: Boolean,
    canManageChannels: Boolean,
    canManageAdmins: Boolean,
    canManageTemplates: Boolean
  },
  isActive: Boolean,        // Faol/nofaol
  lastLogin: Date,          // Oxirgi kirish
  addedBy: Number,          // Kim qo'shgan (User ID)
  createdAt: Date,
  updatedAt: Date
}
```

## 🎨 UI Yangilanishlari

### Admins Sahifasi

- **Table:** userId, ism, username, rol, huquqlar, status, qo'shilgan sana
- **Badge'lar:**
  - Rol: Superadmin (qizil), Admin (sariq), Moderator (ko'k)
  - Status: Faol (yashil), Nofaol (kulrang)
  - Permissions: Emoji badge'lar
- **Modals:** 2 ta (Add, Edit)
- **Actions:** Tahrirlash, O'chirish (superadmin emas bo'lsa)

### Sidebar Menu

Yangi item qo'shildi:

```
👨‍💼 Adminlar
```

### CSS Classes

- `.permissions-list` - Flexbox grid
- `.permission-badge` - Kichik badge'lar
- `.permissions-grid` - 2 column checkbox grid
- `.checkbox-label` - Checkbox label style
- `.badge-warning` - Sariq badge (admin)
- `.badge-info` - Ko'k badge (moderator)

## 📝 Database Functions

```javascript
// modules/functions.js da qo'shilgan:
createAdmin(userId, firstName, addedBy, data);
getAdmin(userId);
getAllAdmins();
updateAdmin(userId, updateData);
deleteAdmin(userId); // isActive: false qiladi
checkAdminPermission(userId, permission);
```

## 🐛 Debugging

### Admin Tekshirish

```javascript
// Bot konsolida:
const admin = await getAdmin(1551855614);
console.log(admin);
```

### Permission Tekshirish

```javascript
const canBroadcast = await checkAdminPermission(1551855614, "canBroadcast");
console.log(canBroadcast); // true/false
```

### Guruh Callback

```javascript
// bot.js da:
console.log("Chat ID:", ctx.chat?.id);
console.log("User ID:", ctx.from.id);
console.log("Is Admin Group:", ctx.chat?.id?.toString() === adminGroupId);
```

## 📦 Yangi Dependencies

Yangi paket o'rnatilmadi - barcha mavjud dependencies bilan ishlaydi!

## ✅ Test Checklist

- [ ] MongoDB'da superadmin yaratildi
- [ ] .env'da ADMIN_GROUP_ID to'g'ri
- [ ] Bot qayta ishga tushirildi
- [ ] Admin panel'da /admins sahifasi ochildi
- [ ] Yangi admin qo'shish ishlaydi
- [ ] Admin tahrirlash ishlaydi
- [ ] Admin o'chirish ishlaydi
- [ ] Guruhga tabrik yuboriladi
- [ ] Guruhda inline tugmalar ishlaydi
- [ ] Tasdiqlash kanalga chiqaradi
- [ ] Rad etish userga xabar yuboradi

## 🎯 Keyingi Qadamlar

1. Permission-based UI hiding (tegishli huquq bo'lmasa button/page yashirish)
2. Admin activity log (kim qachon nima qilgan)
3. Admin statistics (har bir admin necha marta tasdiqlagan)
4. Email notification (yangi admin qo'shilganda)
5. Two-factor authentication
6. Role management UI (custom role yaratish)

## 📞 Yordam

Qo'shimcha qo'llanma: `ADMIN_SETUP.md`

---

**Version:** 2.0  
**Date:** 2025-01-24  
**Author:** GitHub Copilot
