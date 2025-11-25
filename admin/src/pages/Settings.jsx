import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import axios from "axios";
import { getChannels } from "../utils/api";

function Settings() {
  const [channels, setChannels] = useState([]);
  const [publishChannelId, setPublishChannelId] = useState("");
  const [botAbout, setBotAbout] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Get channels
      const channelsResponse = await getChannels();
      if (channelsResponse.data.success) {
        setChannels(channelsResponse.data.data);
      }

      // Get current publish channel setting
      const settingsResponse = await axios.get(
        "http://localhost:3000/api/settings/publish_channel_id",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Publish channel response:", settingsResponse.data);
      if (settingsResponse.data.success && settingsResponse.data.value) {
        setPublishChannelId(settingsResponse.data.value);
      }

      // Get bot about text
      const botAboutResponse = await axios.get(
        "http://localhost:3000/api/settings/bot_about",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Bot about response:", botAboutResponse.data);
      if (botAboutResponse.data.success && botAboutResponse.data.value) {
        setBotAbout(botAboutResponse.data.value);
      }
    } catch (error) {
      console.error("Settings xatolik:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePublishChannel = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:3000/api/settings",
        {
          key: "publish_channel_id",
          value: publishChannelId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert("✅ Sozlamalar saqlandi!");
      }
    } catch (error) {
      alert("❌ Xatolik: " + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBotAbout = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:3000/api/settings",
        {
          key: "bot_about",
          value: botAbout,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert("✅ Bot haqida matni saqlandi!");
      }
    } catch (error) {
      alert("❌ Xatolik: " + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="spinner"></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header">
        <h1>⚙️ Sozlamalar</h1>
        <p>Bot sozlamalarini boshqarish</p>
      </div>

      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          marginBottom: "20px",
        }}
      >
        <h2>📢 Tabriklar E'lon Qilinadigan Kanal</h2>
        <p style={{ color: "#6B7280", marginBottom: "20px" }}>
          Tasdiqlangan tabriklar qaysi kanalga e'lon qilinishini tanlang
        </p>

        {publishChannelId && (
          <div
            style={{
              background: "#F0FDF4",
              border: "1px solid #86EFAC",
              borderRadius: "8px",
              padding: "15px",
              marginBottom: "15px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>✅</span>
              <div>
                <strong style={{ color: "#166534" }}>Hozirgi kanal:</strong>
                <br />
                <span style={{ color: "#15803D" }}>
                  {channels.find((ch) => ch.channelId === publishChannelId)
                    ?.channelIcon || "📢"}{" "}
                  {channels.find((ch) => ch.channelId === publishChannelId)
                    ?.channelName || "Noma'lum"}{" "}
                  (@
                  {channels.find((ch) => ch.channelId === publishChannelId)
                    ?.channelUsername || "N/A"}
                  )
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Kanal tanlash</label>
          <select
            value={publishChannelId}
            onChange={(e) => setPublishChannelId(e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="">-- Kanallardan birini tanlang --</option>
            {channels.map((channel) => (
              <option key={channel._id} value={channel.channelId}>
                {channel.channelIcon || "📢"} {channel.channelName} (@
                {channel.channelUsername})
              </option>
            ))}
          </select>
          <small>
            Agar tanlanmasa, birinchi faol kanal avtomatik ishlatiladi
          </small>
        </div>

        <button
          onClick={handleSavePublishChannel}
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? "Saqlanmoqda..." : "💾 Saqlash"}
        </button>
      </div>

      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          marginBottom: "20px",
        }}
      >
        <h2>🤖 Bot Haqida Matni</h2>
        <p style={{ color: "#6B7280", marginBottom: "20px" }}>
          Foydalanuvchilar "Bot haqida" tugmasini bossaganda ko'rinadigan matn
        </p>

        <div className="form-group">
          <label>Bot haqida matni</label>
          <textarea
            value={botAbout}
            onChange={(e) => setBotAbout(e.target.value)}
            rows="6"
            placeholder="Misol: 👨‍💻 Dasturchi: @admin&#10;📖 Bot maqsadi: Bayramona tabriklar yuborish&#10;💡 Bot imkoniyatlari: ..."
            style={{ width: "100%", fontFamily: "inherit" }}
          />
          <small>
            HTML teglari ishlatish mumkin: &lt;b&gt;qalin&lt;/b&gt;,
            &lt;i&gt;yotiq&lt;/i&gt;, &lt;code&gt;kod&lt;/code&gt;
          </small>
        </div>

        <button
          onClick={handleSaveBotAbout}
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? "Saqlanmoqda..." : "💾 Saqlash"}
        </button>
      </div>

      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          marginBottom: "20px",
        }}
      >
        <h2>📝 Qo'llanma</h2>
        <div style={{ lineHeight: "1.8" }}>
          <h3 style={{ fontSize: "16px", marginTop: "15px" }}>
            📢 Kanal Qo'shish
          </h3>
          <ol style={{ paddingLeft: "20px", color: "#6B7280" }}>
            <li>Kanal yarating va bot'ni admin qiling</li>
            <li>
              Kanal ID'sini oling (bot'ni kanalga qo'shib /start yuboring)
            </li>
            <li>"Kanallar" bo'limidan "➕ Kanal qo'shish" tugmasini bosing</li>
            <li>Kanal ma'lumotlarini to'ldiring</li>
            <li>"Majburiy obuna" belgisini tanlang agar kerak bo'lsa</li>
            <li>
              Tartib raqamini belgilang (kamroq raqam birinchi ko'rsatiladi)
            </li>
          </ol>

          <h3 style={{ fontSize: "16px", marginTop: "20px" }}>
            👥 Majburiy Kanallar
          </h3>
          <p style={{ paddingLeft: "20px", color: "#6B7280" }}>
            • "Majburiy obuna" belgilangan kanallar botdan foydalanish uchun
            majburiy
            <br />
            • Foydalanuvchi bu kanallarga obuna bo'lmasa, bot ishlamaydi
            <br />
            • "Majburiy qilish/bekor qilish" tugmasi bilan holatni o'zgartiring
            <br />• Tartib bo'yicha foydalanuvchilarga ko'rsatiladi
          </p>

          <h3 style={{ fontSize: "16px", marginTop: "20px" }}>
            🚫 Foydalanuvchilarni Bloklash
          </h3>
          <p style={{ paddingLeft: "20px", color: "#6B7280" }}>
            • "Foydalanuvchilar" bo'limidan kerakli userni toping
            <br />
            • "🚫 Bloklash" tugmasini bosing
            <br />
            • Bloklangan user botdan foydalana olmaydi
            <br />• Blokni bekor qilish uchun yana bir marta tugmani bosing
          </p>

          <h3 style={{ fontSize: "16px", marginTop: "20px" }}>
            ✅ Tabriklar Tasdiqlash
          </h3>
          <p style={{ paddingLeft: "20px", color: "#6B7280" }}>
            • Yangi tabriklar admin guruhiga avtomatik yuboriladi
            <br />
            • Admin panel'da "Tabriklar" bo'limida ham ko'rish mumkin
            <br />
            • "✅ Tasdiqlash" - kanal'ga e'lon qilinadi
            <br />• "❌ Rad etish" - user'ga sabab bilan xabar yuboriladi
          </p>

          <h3 style={{ fontSize: "16px", marginTop: "20px" }}>
            👨‍💼 Admin Qo'shish
          </h3>
          <p style={{ paddingLeft: "20px", color: "#6B7280" }}>
            • "Adminlar" bo'limidan yangi admin qo'shish mumkin
            <br />
            • Har bir admin'ga alohida huquqlar beriladi
            <br />
            • Superadmin - barcha huquqlar
            <br />
            • Admin - ko'p huquqlar
            <br />• Moderator - faqat tasdiqlash va bloklash
          </p>
        </div>
      </div>

      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        }}
      >
        <h2>🔐 Xavfsizlik</h2>
        <div className="form-group">
          <label>Admin Panel Port</label>
          <input type="text" value="3000" readOnly />
          <small>.env faylida ADMIN_PORT</small>
        </div>

        <div className="form-group">
          <label>JWT Token Muddati</label>
          <input type="text" value="24 soat" readOnly />
          <small>Har 24 soatda qayta login qilish kerak</small>
        </div>

        <div className="form-group">
          <label>MongoDB</label>
          <input type="text" value="Ulangan ✅" readOnly />
          <small>Database faol holda</small>
        </div>
      </div>
    </Layout>
  );
}

export default Settings;
