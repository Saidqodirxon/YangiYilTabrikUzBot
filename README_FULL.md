# 🎉 Bayramona Tabrik Bot - To'liq Versiya

## 🚀 Yangi Imkoniyatlar

### 👥 Foydalanuvchilar uchun:

- ✅ Tabrik yuborish (matn, rasm, video)
- ✅ Ikki bosqichli tasdiqlash (user + admin)
- ✅ Namoz taqvimi (shahar tanlash)
- ✅ Sertifikat yaratish (admin tomonidan sozlangan o'lchamlar)
- ✅ Taklif yuborish
- ✅ Bot haqida ma'lumot

### 🔐 Admin Panel:

#### 1. 📊 Statistika

- Jami foydalanuvchilar soni
- Tasdiqlangan tabriklar
- Kutilayotgan tabriklar
- Yuborilgan xabarlar
- Kanallar soni

#### 2. 📝 Tabriklar Boshqaruvi

- Kutilayotgan tabriklarni ko'rish
- Tasdiqlash/rad etish
- Avtomatik kanalga joylashtirish
- Foydalanuvchiga xabar yuborish

#### 3. 📢 Xabar Yuborish (Broadcast)

**Telegram limitlari bilan:**

- 30 xabar/soniya
- Avtomatik batch yuborish
- Real-time progress ko'rsatish
- Muvaffaqiyatli/xato statistikasi
- Matn, rasm, video qo'llab-quvvatlash

**Misol:**

```
Jami: 1000 foydalanuvchi
✅ Yuborildi: 950
❌ Xatolik: 50
⏳ 95% (28-30 xabar/soniya)
```

#### 4. 📺 Kanallar Boshqaruvi

**Kanal qo'shish:**

```
-1001234567890
kanalusername
Kanal nomi
```

**Imkoniyatlar:**

- Majburiy/ixtiyoriy kanal
- Faol/nofaol qilish
- O'chirish
- A'zolikni tekshirish

#### 5. 🎨 Sertifikat Boshqaruvi

**Sertifikat qo'shish:**

```
1           <- Template raqami
1920        <- Kenglik (px)
1080        <- Balandlik (px)
Yangi yil   <- Nomi
```

**API format:**

```
https://apis.realcoder.uz/api/newyear/1?text=Matn
                                      ^
                                Template raqami
```

Foydalanuvchilar admin tomonidan sozlangan o'lchamlarda sertifikat olishadi.

#### 6. ⚙️ Sozlamalar

- Telegram rate limit: 30 xabar/soniya
- Batch kechikish: 1000ms
- Kodda sozlanadi

## 📦 MongoDB Modellari

### 1. User

```javascript
{
  userId: Number,
  firstName: String,
  username: String,
  location: String,
  is_block: Boolean,
  isAdmin: Boolean
}
```

### 2. Congrats

```javascript
{
  userId: Number,
  messageType: "text" | "photo" | "video",
  message: String,
  fileId: String,
  userApproved: Boolean,
  adminApproved: Boolean,
  rejectedByAdmin: Boolean,
  publishedToChannel: Boolean
}
```

### 3. Channel

```javascript
{
  channelId: String,
  channelUsername: String,
  channelName: String,
  isRequired: Boolean,
  isActive: Boolean,
  order: Number
}
```

### 4. Certificate

```javascript
{
  templateNumber: Number,
  name: String,
  width: Number,
  height: Number,
  isActive: Boolean
}
```

### 5. Broadcast

```javascript
{
  message: String,
  messageType: String,
  totalUsers: Number,
  successCount: Number,
  failureCount: Number,
  status: "pending" | "processing" | "completed"
}
```

## 🔧 O'rnatish

### 1. Paketlarni o'rnatish:

```bash
npm install
```

### 2. .env fayl:

```env
BOT_TOKEN=your_bot_token
DB_URL=mongodb+srv://user:pass@cluster.mongodb.net/dbname
ADMIN_ID=your_telegram_id
ADMIN_USER=your_username
BOT_USER=bot_username
CHANNEL_USER=main_channel_username
```

### 3. Ishga tushirish:

```bash
npm start
```

## 📱 Admin Buyruqlari

### Botda:

- `/start` - Botni boshlash
- `/admin` - Admin panel

### Xususiyatlar:

#### Kanal qo'shish:

1. Admin panel → Kanallar
2. "Kanal qo'shish" tugmasi
3. Ma'lumotlarni 3 qatorda yuboring

#### Xabar yuborish:

1. Admin panel → Xabar yuborish
2. Matn/rasm/video yuboring
3. Tasdiqlang
4. Progress real-time ko'rsatiladi

#### Sertifikat qo'shish:

1. Admin panel → Sertifikatlar
2. "Sertifikat qo'shish"
3. 4 qator: raqam, kenglik, balandlik, nom

## 🔐 Xavfsizlik

### Rate Limiting:

- Telegram: 30 xabar/soniya (official limit)
- Bot avtomatik 1 soniya kutadi har 30 xabardan keyin
- Retry mexanizmi xatolar uchun

### Error Handling:

- Try-catch barcha funksiyalarda
- Console.error loglar
- Foydalanuvchiga tushunarli xabarlar

## 📊 Broadcast Algoritmi

```javascript
1. Barcha userlarni olish
2. 30 ta guruhlarga bo'lish
3. Har bir guruhni parallel yuborish
4. 1 soniya kutish
5. Keyingi guruh
6. Real-time progress yangilash
```

## 🎨 Sertifikat Ishlash

```javascript
1. Admin o'lcham kiritadi (1920x1080)
2. Foydalanuvchi template tanlaydi
3. Matn kiritadi
4. API: /api/newyear/{template}?text={matn}
5. Rasm qaytadi (admin o'lchamida)
```

## 🔄 Tabrik Oqimi

```
User → Matn yozadi
     ↓
User → Tasdiqlaydi (userApproved: true)
     ↓
MongoDB → Saqlanadi
     ↓
Admin → Ko'radi
     ↓
Admin → Tasdiqlaydi (adminApproved: true)
     ↓
Kanal → Joylash tiriladi (publishedToChannel: true)
     ↓
User → Xabar oladi ✅
```

## 📈 Monitoring

### Logs:

- User yaratish
- Tabrik yuborish
- Admin tasdiqlar
- Broadcast progress
- Xatolar

### Statistika:

- Real-time userlar
- Tabriklar (tasdiqlangan/rad etilgan)
- Kanallar
- Broadcast tarixiy

## 🤝 Qo'llab-quvvatlash

Telegram: @${process.env.ADMIN_USER}

---

**Ishlab chiqildi: Saidqodirxon Rahimov**
