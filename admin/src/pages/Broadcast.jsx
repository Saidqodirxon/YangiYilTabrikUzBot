import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getBroadcastStats, sendBroadcast } from "../utils/api";

function Broadcast() {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    lastBroadcast: null,
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState({ sent: 0, failed: 0, total: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await getBroadcastStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Broadcast stats xatolik:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      alert("❌ Xabar matnini kiriting!");
      return;
    }

    if (
      !window.confirm(
        `Xabarni barcha foydalanuvchilarga yuborishni tasdiqlaysizmi?\n\nMatn: ${message.substring(
          0,
          100
        )}...`
      )
    ) {
      return;
    }

    setSending(true);
    setProgress({ sent: 0, failed: 0, total: 0 });

    try {
      const response = await sendBroadcast({ message });
      if (response.data.success) {
        alert(
          `✅ Xabar yuborildi!\n\nMuvaffaqiyatli: ${response.data.sent}\nXatolik: ${response.data.failed}`
        );
        setMessage("");
        fetchStats();
      }
    } catch (error) {
      alert("❌ Xatolik: " + (error.response?.data?.message || error.message));
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>📢 Xabar Yuborish</h1>
          <p>Barcha foydalanuvchilarga xabar yuborish</p>
        </div>
      </div>

      {loading ? (
        <div className="spinner"></div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>{stats.total}</h3>
                <p>Jami yuborilgan</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>{stats.completed}</h3>
                <p>Muvaffaqiyatli</p>
              </div>
            </div>

            {stats.lastBroadcast && (
              <div className="stat-card">
                <div className="stat-icon">⏰</div>
                <div className="stat-content">
                  <h3>
                    {new Date(stats.lastBroadcast.createdAt).toLocaleDateString(
                      "uz-UZ"
                    )}
                  </h3>
                  <p>Oxirgi xabar</p>
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "10px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            }}
          >
            <div
              className="alert"
              style={{
                background: "#FEF3C7",
                color: "#92400E",
                borderLeft: "4px solid #F59E0B",
                marginBottom: "20px",
              }}
            >
              <strong>⚠️ Eslatma:</strong> Bu xabar barcha foydalanuvchilarga
              yuboriladi. Telegram limiti: 30 xabar/soniya.
            </div>

            <form onSubmit={handleSend}>
              <div className="form-group">
                <label>Xabar Matni *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows="8"
                  placeholder="Bu yerga xabar matnini kiriting..."
                  style={{ resize: "vertical", fontSize: "16px" }}
                  required
                  disabled={sending}
                />
                <small>
                  HTML formatda yozish mumkin: <code>&lt;b&gt;</code>,{" "}
                  <code>&lt;i&gt;</code>, <code>&lt;code&gt;</code>
                </small>
              </div>

              {sending && (
                <div
                  style={{
                    background: "#EFF6FF",
                    padding: "20px",
                    borderRadius: "8px",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ marginBottom: "10px" }}>
                    <strong>📤 Yuborilmoqda...</strong>
                  </div>
                  <div
                    className="spinner"
                    style={{ margin: "20px auto" }}
                  ></div>
                  <p style={{ textAlign: "center", color: "#6B7280" }}>
                    Iltimos kuting, xabar barcha foydalanuvchilarga
                    yuborilmoqda...
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={sending || !message.trim()}
                style={{ fontSize: "18px", padding: "15px" }}
              >
                {sending ? "⏳ Yuborilmoqda..." : "📤 Xabar Yuborish"}
              </button>
            </form>
          </div>
        </>
      )}
    </Layout>
  );
}

export default Broadcast;
