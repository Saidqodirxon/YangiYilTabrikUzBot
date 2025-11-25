# 🎉 Bayramona Tabrik Bot - To'liq Qo'llanma

## 📋 Mundarija

1. [Umumiy Ma'lumot](#umumiy-malumot)
2. [Admin Panel](#admin-panel)
3. [MongoDB Setup](#mongodb-setup)
4. [Xususiyatlar](#xususiyatlar)
5. [FAQ](#faq)

---

## 🎯 Umumiy Ma'lumot

### Bot Nima Qiladi?

- ✅ Foydalanuvchilar tabrik yuboradi
- ✅ User va Admin tomonidan tasdiqlash
- ✅ Kanalga avtomatik joylashtirish
- ✅ Sertifikat yaratish
- ✅ Majburiy a'zolik tizimi
- ✅ Barcha foydalanuvchilarga xabar yuborish

---

## 🔐 Admin Panel

### Admin Bo'lish

`.env` faylida:

```env
ADMIN_ID=1234567890  # Sizning Telegram ID
```

### Admin Buyruqlari

```
/admin - Admin panelni ochish
```

---

## 1️⃣ STATISTIKA

**Ko'rsatiladi:**

- 👥 Jami foydalanuvchilar
- ✅ Tasdiqlangan tabriklar
- ⏳ Kutilayotgan tabriklar
- 📢 Yuborilgan xabarlar
- 📺 Kanallar soni

---

## 2️⃣ TABRIKLAR BOSHQARUVI

### Kutilayotgan Tabriklarni Ko'rish

1. Admin panel → **Tabriklar**
2. Birinchi tabrikni ko'rish
3. Tasdiqlash ✅ yoki Rad etish ❌

**Tasdiqlanganda:**

- Kanalga avtomatik joylanadi
- Foydalanuvchiga "✅ Tasdiqlandi" xabari keladi
- `publishedToChannel: true` MongoDB'da

**Rad etilganda:**

- Foydalanuvchiga sabab bilan xabar
- `rejectedByAdmin: true` MongoDB'da

---

## 3️⃣ XABAR YUBORISH (Broadcast)

### Telegram Limitlari

```
✅ 30 xabar per soniya (Telegram official limit)
✅ 1 soniya kechikish har 30 xabardan keyin
✅ Avtomatik retry xatolar uchun
```

### Jarayon

1. **Admin panel → Xabar yuborish**

2. **Xabar yuboring:**

   - Matn
   - Rasm + caption
   - Video + caption

3. **Tasdiqlash:**

   ```
   ✅ Yuborilsinmi?
   ```

4. **Progress real-time:**

   ```
   📊 Yuborilmoqda...

   ✅ Yuborildi: 850
   ❌ Xatolik: 25
   📈 Jami: 875/1000
   ⏳ 87%
   ```

5. **Natija:**

   ```
   ✅ XABAR YUBORILDI!

   ✅ Muvaffaqiyatli: 975
   ❌ Xatolik: 25
   📊 Jami: 1000
   ```

### Algoritm

```javascript
// 1. Userlarni olish
const users = await getAllUsers(); // 1000 ta

// 2. Batch'larga bo'lish (30 ta)
for (let i = 0; i < users.length; i += 30) {
  const batch = users.slice(i, i + 30);

  // 3. Parallel yuborish
  await Promise.allSettled(batch.map((user) => sendMessage(user)));

  // 4. Progress yangilash
  updateProgress(i, users.length);

  // 5. Kutish (1 soniya)
  await sleep(1000);
}
```

### Xatoliklarni Qo'lga Olish

```javascript
try {
  await bot.telegram.sendMessage(userId, message);
  successCount++;
} catch (error) {
  failureCount++;
  console.error(`Yuborilmadi ${userId}:`, error.message);
  // User bloklagan yoki o'chirgan
}
```

**Umumiy xatolar:**

- User botni bloklagan
- User o'chirib yuborgan
- Telegram server xatoligi

**Yechim:** Avtomatik ignore, statistikada ko'rsatiladi

---

## 4️⃣ KANALLAR BOSHQARUVI

### Kanal Qo'shish

1. **Admin panel → Kanallar → ➕ Kanal qo'shish**

2. **3 qatorda ma'lumot yuboring:**

   ```
   -1001234567890
   bayramonatabrik
   Bayramona Tabriklar
   ```

   **Tushuntirish:**

   - 1-qator: Channel ID (`-100` bilan boshlanadi)
   - 2-qator: Username (@ siz)
   - 3-qator: Kanal nomi

3. **Channel ID olish:**
   - [@userinfobot](https://t.me/userinfobot) dan kanalga forward qiling
   - Yoki kanaldan biror xabarni botga forward qiling

### Kanal Boshqarish

**Kanal tanlash → Ma'lumotlar:**

```
📺 Bayramona Tabriklar
🆔 -1001234567890
📱 @bayramonatabrik
✅ Majburiy: Ha
🟢 Faol: Ha
```

**Amallar:**

- ✅/❌ Majburiy qilish
- 🗑 O'chirish

### Majburiy A'zolik Tizimi

**Ishlash:**

```javascript
// 1. User /start bosadi
// 2. Barcha majburiy kanallarni tekshirish
for (const channel of channels) {
  const member = await getChatMember(channel.channelId, userId);

  if (!isMember(member)) {
    // Kanal tugmalarini ko'rsatish
    return showChannelButtons();
  }
}

// 3. Agar barchaga a'zo bo'lsa
showMainMenu();
```

---

## 5️⃣ SERTIFIKATLAR

### Sertifikat Qo'shish

1. **Admin panel → Sertifikatlar → ➕ Sertifikat qo'shish**

2. **4 qatorda ma'lumot:**

   ```
   1
   1920
   1080
   Yangi yil
   ```

   **Tushuntirish:**

   - 1-qator: Template raqami (API'da ishlatiladi)
   - 2-qator: Kenglik (pixel)
   - 3-qator: Balandlik (pixel)
   - 4-qator: Sertifikat nomi

### API Format

```
https://apis.realcoder.uz/api/newyear/{template}?text={matn}
```

**Misol:**

```
Template: 1
Kenglik: 1920
Balandlik: 1080
Matn: "Yangi yil bilan!"

URL: https://apis.realcoder.uz/api/newyear/1?text=Yangi%20yil%20bilan!
```

### Foydalanuvchi Tomonidan

1. **Bosh menyu → 🎨 Sertifikat**

2. **Template tanlash:**

   ```
   1. Yangi yil (1920x1080)
   2. Ramazon (1080x1080)
   3. Navro'z (1200x800)
   ```

3. **Matn kiriting:**

   ```
   Yangi yil bilan tabriklayman!
   ```

4. **Sertifikat tayyor!**
   - Admin kiritgan o'lchamda
   - Rasm sifatida yuboriladi

---

## 6️⃣ SOZLAMALAR

### Rate Limiting

**bot.js da:**

```javascript
const TELEGRAM_RATE_LIMIT = 30; // 30 xabar/soniya
const BATCH_DELAY = 1000; // 1000ms = 1 soniya
```

**O'zgartirish:**

```javascript
// Sekinroq (xavfsizroq)
const TELEGRAM_RATE_LIMIT = 20;
const BATCH_DELAY = 1500;

// Tezroq (risk)
const TELEGRAM_RATE_LIMIT = 35;
const BATCH_DELAY = 800;
```

⚠️ **Ogohlantirish:** Telegram'ning 30 xabar/soniya limitidan oshirsangiz, bot ban bo'lishi mumkin!

---

## 📦 MongoDB Setup

### 1. MongoDB Atlas (Cloud)

1. **Account yaratish:**

   - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Free tier (0$ - 512MB)

2. **Cluster yaratish:**

   - Cluster Name: `bayramonatabrikbot`
   - Provider: AWS
   - Region: Frankfurt (yaqin)

3. **Database User:**

   - Username: `admin`
   - Password: `strong_password`

4. **IP Whitelist:**

   - Click "Add IP Address"
   - **0.0.0.0/0** (barcha IP'lar) yoki
   - O'z IP manzilingiz

5. **Connection String:**

   ```
   mongodb+srv://admin:password@cluster0.xxxxx.mongodb.net/bayramonatabrikbot
   ```

6. **.env ga qo'shish:**
   ```env
   DB_URL=mongodb+srv://admin:password@cluster0.xxxxx.mongodb.net/bayramonatabrikbot?retryWrites=true&w=majority
   ```

### 2. Local MongoDB

```bash
# Windows
# MongoDB Compass yuklab oling
# Connection: mongodb://localhost:27017/bayramonatabrikbot

# .env
DB_URL=mongodb://localhost:27017/bayramonatabrikbot
```

### 3. MongoDB Tekshirish

```bash
node bot.js
```

**Muvaffaqiyatli:**

```
✅ MongoDB'ga muvaffaqiyatli ulandi.
✅ Bot ishga tushdi!
```

**Xatolik:**

```
⚠️  MongoDB'ga ulanishda xatolik: ...
ℹ️  Bot MongoDB'siz ishlaydi (ma'lumotlar saqlanmaydi)
✅ Bot ishga tushdi!
```

---

## 🎯 Xususiyatlar

### 1. Ikki Bosqichli Tasdiqlash

```
User → Matn yozadi
     ↓
User → ✅ Tasdiqlaydi
     ↓
MongoDB → userApproved: true
     ↓
Admin → Ko'radi
     ↓
Admin → ✅/❌ Qaror qabul qiladi
     ↓
MongoDB → adminApproved: true
     ↓
Kanal → Avtomatik joylanadi
     ↓
User → ✅ Xabar oladi
```

### 2. Smart Rate Limiting

```javascript
// Her 30 ta xabar
for (let i = 0; i < users.length; i += 30) {
  // Parallel yuborish (tez)
  await Promise.allSettled(...);

  // Kutish (Telegram limiti uchun)
  await sleep(1000);

  // Progress (har 30 ta)
  updateProgress();
}
```

### 3. Error Recovery

```javascript
// 3 marta urinish
async function sendWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1)); // 1s, 2s, 3s
    }
  }
}
```

---

## ❓ FAQ

### Q: Bot sekin xabar yuborayapti?

**A:** Bu normal. Telegram limiti:

- 30 xabar/soniya
- 1000 foydalanuvchiga ~33 soniya (≈30s)

### Q: Ba'zi userlarga yuborilmadi?

**A:** Umumiy sabablar:

- User botni bloklagan
- User o'chirib yuborgan
- Telegram server xatoligi

Statistikada ko'rsatiladi:

```
✅ Muvaffaqiyatli: 975
❌ Xatolik: 25
```

### Q: MongoDB ulanmayapti?

**A:** IP whitelist tekshiring:

1. MongoDB Atlas → Security → Network Access
2. "0.0.0.0/0" qo'shish (barcha IP)

### Q: Kanal ID qayerdan topaman?

**A:** 3 ta usul:

1. [@userinfobot](https://t.me/userinfobot) - kanaldan forward
2. Kanal sozlamalarida
3. Bot loglarida (getChatMember xatoligi)

### Q: Sertifikat ishlamayapti?

**A:** Tekshiring:

- Template raqami to'g'rimi?
- API URL to'g'rimi?
- Matn URL encode bo'lganmi?

```javascript
// To'g'ri
const url = `${API}/${template}?text=${encodeURIComponent(text)}`;

// Noto'g'ri
const url = `${API}/${template}?text=${text}`;
```

### Q: Admin bo'lolmayapman?

**A:** `.env` faylni tekshiring:

```env
ADMIN_ID=1234567890  # Sizning Telegram ID
```

ID topish: [@userinfobot](https://t.me/userinfobot)

---

## 🚀 Production Deploy

### 1. Environment Variables

```env
# Bot
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ
BOT_USER=YourBotUsername

# Admin
ADMIN_ID=1234567890
ADMIN_USER=YourUsername

# Database
DB_URL=mongodb+srv://...

# Channels
CHANNEL_USER=MainChannelUsername
CHANNEL_USER2=SecondChannelUsername
```

### 2. PM2 (Production)

```bash
# Install PM2
npm install -g pm2

# Start bot
pm2 start bot.js --name bayramona-bot

# Auto-restart on reboot
pm2 startup
pm2 save

# View logs
pm2 logs bayramona-bot

# Restart
pm2 restart bayramona-bot

# Stop
pm2 stop bayramona-bot
```

### 3. Monitoring

```bash
# PM2 monitor
pm2 monit

# Logs
pm2 logs bayramona-bot --lines 100
```

---

## 📞 Support

**Dasturchi:** Saidqodirxon Rahimov
**Telegram:** @Saidqodirxon

---

## 📄 License

MIT License - ishlatish uchun bepul

---

**Oxirgi yangilanish:** 2025-01-24
