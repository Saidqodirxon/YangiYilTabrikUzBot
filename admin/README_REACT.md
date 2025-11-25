# Bayram Bot - React Admin Panel

React + Vite + JWT Authentication bilan yaratilgan admin panel.

## 🚀 Xususiyatlar

- ✅ JWT Authentication
- ✅ React 19 + Vite
- ✅ React Router v6
- ✅ Axios API calls
- ✅ Context API for state management
- ✅ Responsive dizayn
- ✅ Secure token management

## 📦 O'rnatish

```bash
cd admin-panel
npm install
```

## 🔧 Sozlash

`.env` faylda quyidagi sozlamalar bo'lishi kerak:

```env
ADMIN_PASSWORD=admin123
ADMIN_PORT=3000
JWT_SECRET=bayramona-jwt-secret-key-2025-change-this-in-production
```

## 🏃 Ishga Tushirish

### Backend (admin.js)

```bash
# Root papkada
node admin.js
```

Backend: `http://localhost:3000`

### Frontend (React)

```bash
# admin-panel papkasida
npm run dev
```

Frontend: `http://localhost:5173`

## 📱 Sahifalar

- **Login** - JWT token olish
- **Dashboard** - Umumiy statistika
- **Users** - Foydalanuvchilar ro'yxati (pagination)
- **Congrats** - Tabriklarni tasdiqlash/rad etish
- **Channels** - Kanallarni boshqarish (CRUD)
- **Certificates** - Sertifikatlarni qo'shish
- **Broadcast** - Xabar yuborish statistikasi
- **Settings** - Sozlamalarni ko'rish

## 🔐 Authentication

JWT token `localStorage` da saqlanadi:

- Token expire: 24 soat
- Auto-refresh har 30 soniyada
- Token expireda `/login`ga redirect

## 🔌 API Endpoints

### Auth

- `POST /api/auth/login` - Login (password → token)
- `GET /api/auth/verify` - Token verify

### Data

- `GET /api/stats` - Dashboard statistikasi
- `GET /api/users` - Userlar (pagination)
- `GET /api/congrats` - Pending tabriklar
- `POST /api/congrats/:id/approve` - Tasdiqlash
- `POST /api/congrats/:id/reject` - Rad etish
- `GET /api/channels` - Kanallar
- `POST /api/channels` - Kanal qo'shish
- `PUT /api/channels/:id/toggle` - Toggle required
- `DELETE /api/channels/:id` - Kanal o'chirish
- `GET /api/certificates` - Sertifikatlar
- `POST /api/certificates` - Sertifikat qo'shish
- `GET /api/broadcast/stats` - Broadcast statistikasi

## 🛠️ Texnologiyalar

- **React 19** - UI framework
- **Vite** - Build tool (Rolldown)
- **React Router v6** - Routing
- **Axios** - HTTP client
- **JWT** - Authentication
- **Context API** - State management
- **CSS3** - Styling

## 📂 Struktura

```
admin-panel/
├── src/
│   ├── components/
│   │   ├── Layout.jsx         # Sidebar + main layout
│   │   └── PrivateRoute.jsx   # Protected route wrapper
│   ├── context/
│   │   └── AuthContext.jsx    # JWT auth context
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Users.jsx
│   │   ├── Congrats.jsx
│   │   ├── Channels.jsx
│   │   ├── Certificates.jsx
│   │   ├── Broadcast.jsx
│   │   └── Settings.jsx
│   ├── utils/
│   │   └── api.js             # Axios instance + endpoints
│   ├── App.jsx                # Routes
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── index.html
├── vite.config.js
└── package.json
```

## 🔒 Xavfsizlik

- JWT token localStorage da
- Auto-logout on 401/403
- CORS enabled for localhost:5173
- Password-based authentication
- Token expiration: 24h
- Secure HTTP headers

## 📝 Login Ma'lumotlari

**Parol:** `.env` faylidagi `ADMIN_PASSWORD`

Default: `admin123`

## 🐛 Debugging

### MongoDB ulanish xatoligi

```bash
# IP whitelist tekshiring
# MongoDB Atlas → Network Access → Add IP Address → 0.0.0.0/0
```

### CORS xatoligi

```javascript
// admin.js da CORS sozlamalari:
origin: "http://localhost:5173";
```

### Token expiration

```javascript
// localStorage dan tokenni o'chirish:
localStorage.removeItem("token");
```

## 🚀 Production Build

```bash
npm run build
npm run preview
```

Build files: `dist/` papkasida

## 📧 Murojaat

- **Developer:** Saidqodirxon
- **Telegram:** @SaidQodiriy
- **Bot:** @YangiYilTabrikUzBot

## 📄 Litsenziya

MIT License
