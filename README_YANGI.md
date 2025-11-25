# Bayramona Tabrik Bot - Yangilangan versiya

## O'zgarishlar

### MongoDB Modellari

1. **User Model** - Foydalanuvchi ma'lumotlari

   - userId, firstName, username
   - location, language
   - isAdmin, is_block

2. **Congrats Model** - Tabriklar

   - Ikki bosqichli tasdiqlash (user va admin)
   - Text, photo, video qo'llab-quvvatlash
   - Rad etish sababi
   - Kanalga joylanish holati

3. **Settings Model** - Bot sozlamalari

### Asosiy Xususiyatlar

#### Foydalanuvchilar uchun:

- ✅ Tabrik yuborish (text, photo, video)
- ✅ Tabrikni tasdiqlash/qayta yuborish
- ✅ Namoz taqvimi (bugun/haftalik)
- ✅ Joylashuv saqlash
- ✅ Duolar bo'limi
- ✅ Taklif yuborish

#### Admin uchun:

- ✅ Statistika ko'rish
- ✅ Kutilayotgan tabriklarni ko'rish
- ✅ Tabriklarni tasdiqlash/rad etish
- ✅ Foydalanuvchilarga xabar yuborish
- ✅ Real-time ma'lumotlar

### Ish jarayoni

1. **Foydalanuvchi tabrik yuboradi**

   - Text, rasm yoki video yuborishi mumkin
   - Bot tabrikni preview ko'rsatadi

2. **Foydalanuvchi tasdiqlaydi**

   - ✅ Tasdiqlash - MongoDB'ga saqlanadi va adminga yuboriladi
   - 🔄 Qayta yuborish - yangi matn yozish imkoniyati
   - ❌ Bekor qilish - jarayonni to'xtatish

3. **Admin ko'rib chiqadi**

   - Barcha kutilayotgan tabriklar ro'yxati
   - Har bir tabrikni alohida ko'rish
   - ✅ Tasdiqlash - kanalga joylanadi
   - ❌ Rad etish - foydalanuvchiga sabab bilan xabar

4. **Natija**
   - Tasdiqlangan tabrik kanalga joylanadi
   - Foydalanuvchiga xabar keladi
   - Statistikada hisoblanadi

## Ishlatish

### Eski bot.js ni zaxiralash:

```bash
mv bot.js bot_old.js
```

### Yangi botni ishga tushirish:

```bash
mv bot_new.js bot.js
npm start
```

## .env faylida bo'lishi kerak:

```
BOT_TOKEN=your_bot_token
DB_URL=mongodb://localhost:27017/bayramonatabrikbot
ADMIN_ID=your_telegram_id
ADMIN_USER=your_username
BOT_USER=bot_username
CHANNEL_ID=@channel_id
CHANNEL_ID2=@channel_id2
CHANNEL_USER=channel_username
CHANNEL_USER2=channel_username2
CHANNEL_USER3=channel_username3
CHANNEL_USER4=channel_username4
```

## Admin buyruqlari:

- `/start` - Botni ishga tushirish
- `/admin` - Admin panel

## Texnologiyalar:

- Node.js
- Telegraf.js
- MongoDB + Mongoose
- Moment.js (timezone)
- Axios (API requests)
