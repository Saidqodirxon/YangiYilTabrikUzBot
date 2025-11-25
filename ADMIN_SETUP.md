# Admin Boshqaruvi

# Admin Boshqaruvi

## Birinchi Superadmin Yaratish

### Usul 1: Seed Skript (Tavsiya etiladi)

```bash
npm run seed
```

Bu buyruq avtomatik ravishda superadmin yaratadi:

- **Login:** admin
- **Password:** admin
- **Role:** superadmin
- **User ID:** .env faylidagi ADMIN_ID

### Usul 2: MongoDB Qo'lda

MongoDB Compass yoki mongosh da ishga tushiring:

```javascript
use bayramonatabrikbot

db.admins.insertOne({
  userId: 1551855614,  // O'zingizning Telegram User ID
  login: "admin",
  password: "$2a$10$YourHashedPasswordHere",  // bcrypt hash
  firstName: "Admin",
  lastName: null,
  username: "Admin",
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

### Password Yangilash

Agar passwordni unutib qo'ygan bo'lsangiz:

```bash
npm run seed:update
```

## Admin Rollari

### Superadmin

- Barcha huquqlarga ega
- Yangi admin qo'shishi mumkin
- Boshqa adminlarni tahrirlashi/o'chirishi mumkin
- Role: `superadmin`

### Admin

- Ko'p huquqlarga ega
- Adminlar boshqaruvi bundan mustasno
- Role: `admin`

### Moderator

- Asosiy huquqlar
- Faqat tabriklarni tasdiqlash va userlarni bloklash
- Role: `moderator`

## Admin Panel Orqali Qo'shish

1. Admin Panel'ga kiring: http://localhost:5173/login
   - **Login:** admin
   - **Password:** admin
2. Admins sahifasiga o'ting: http://localhost:5173/admins
3. "➕ Yangi Admin" tugmasini bosing
4. Ma'lumotlarni kiriting:
   - Telegram User ID (majburiy)
   - Login (admin panel uchun)
   - Ism (majburiy)
   - Familiya (ixtiyoriy)
   - Username (ixtiyoriy)
   - Rol (superadmin/admin/moderator)
   - Huquqlar (checkboxlar)
5. "Qo'shish" tugmasini bosing

## Login Tizimi

### Login Usullari

**Yangi tizim (Tavsiya etiladi):**

- Login: `admin`
- Password: `admin`

**Eski tizim (Backward compatibility):**

- Faqat password: `admin123` (.env'dagi ADMIN_PASSWORD)

### Password Xavfsizligi

- Barcha passwordlar bcrypt bilan hash qilinadi (10 rounds)
- Pre-save hook avtomatik hash qiladi
- `comparePassword()` metodi orqali tekshiriladi
- JWT token 24 soat amal qiladi

## Telegram Bot Orqali

Bot'da adminlar avtomatik ravishda `isAdmin()` funksiyasi orqali tekshiriladi:

- Birinchi ADMIN_ID (.env'dan)
- So'ng MongoDB'dagi admins kolleksiyasidan

## Admin Guruhiga Tabriklar

`.env` faylida admin guruhini sozlang:

```env
ADMIN_GROUP_ID=-1001234567890
```

Bu guruhga barcha yangi tabriklar yuboriladi va inline tugmalar bilan tasdiqlash/rad etish mumkin.

## API Endpoints

```
GET    /api/admins              - Barcha adminlar
POST   /api/admins              - Yangi admin qo'shish
PUT    /api/admins/:id          - Adminni yangilash
DELETE /api/admins/:id          - Adminni o'chirish
GET    /api/admins/check/:id    - Admin ekanligini tekshirish
```

## Permissions

- `canApprove` - Tabriklarni tasdiqlash
- `canBlock` - Userlarni bloklash
- `canBroadcast` - Xabar yuborish
- `canManageChannels` - Kanallarni boshqarish
- `canManageAdmins` - Adminlarni boshqarish
- `canManageTemplates` - Shablonlarni boshqarish

Superadmin barcha huquqlarga avtomatik ega.

## Xavfsizlik

- Faqat superadmin yangi admin qo'sha oladi
- Faqat superadmin adminlarni tahrirlashi/o'chirishi mumkin
- Admin o'zini o'chira olmaydi
- Barcha API'lar JWT token bilan himoyalangan
