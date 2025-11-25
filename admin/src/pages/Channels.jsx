import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import {
  getChannels,
  addChannel,
  toggleChannel,
  deleteChannel,
} from "../utils/api";

function Channels() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    channelId: "",
    channelUsername: "",
    channelName: "",
    channelIcon: "📢",
    isRequired: true,
    order: 1,
  });

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const response = await getChannels();
      if (response.data.success) {
        setChannels(response.data.data);
      }
    } catch (error) {
      console.error("Channels xatolik:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.channelId || !formData.channelUsername) {
      alert("❌ Channel ID va Username majburiy!");
      return;
    }

    try {
      const response = await addChannel(formData);
      if (response.data.success) {
        alert("✅ " + response.data.message);
        setShowModal(false);
        setFormData({
          channelId: "",
          channelUsername: "",
          channelName: "",
          channelIcon: "📢",
          isRequired: true,
          order: 1,
        });
        fetchChannels();
      }
    } catch (error) {
      alert("❌ Xatolik: " + (error.response?.data?.message || error.message));
    }
  };

  const handleToggle = async (id) => {
    console.log("Toggle clicked for ID:", id);
    try {
      const response = await toggleChannel(id);
      console.log("Toggle response:", response.data);
      if (response.data.success) {
        alert("✅ " + response.data.message);
        fetchChannels();
      }
    } catch (error) {
      console.error("Toggle error:", error);
      alert("❌ Xatolik: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Kanalni o'chirmoqchimisiz?")) return;

    try {
      const response = await deleteChannel(id);
      if (response.data.success) {
        alert("✅ " + response.data.message);
        fetchChannels();
      }
    } catch (error) {
      alert("❌ Xatolik: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>📢 Kanallar</h1>
          <p>Majburiy obuna kanallarini boshqarish</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          ➕ Kanal qo'shish
        </button>
      </div>

      {loading ? (
        <div className="spinner"></div>
      ) : channels.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📢</span>
          <h2>Kanallar yo'q</h2>
          <p>Birinchi kanalni qo'shing</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Icon</th>
                <th>Kanal Nomi</th>
                <th>Username</th>
                <th>Channel ID</th>
                <th>Tartib</th>
                <th>Holat</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((channel) => (
                <tr key={channel._id}>
                  <td style={{ fontSize: "24px" }}>
                    {channel.channelIcon || "📢"}
                  </td>
                  <td>
                    <strong>{channel.channelName}</strong>
                  </td>
                  <td>@{channel.channelUsername}</td>
                  <td>
                    <code>{channel.channelId}</code>
                  </td>
                  <td>{channel.order || 1}</td>
                  <td>
                    <span
                      className={`badge ${
                        channel.isRequired ? "badge-success" : "badge-secondary"
                      }`}
                    >
                      {channel.isRequired ? "✅ Majburiy" : "⚪ Majburiy emas"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(channel._id)}
                    >
                      🗑️ O'chirish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Yangi Kanal</h2>
              <button className="close" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Channel ID *</label>
                  <input
                    type="text"
                    value={formData.channelId}
                    onChange={(e) =>
                      setFormData({ ...formData, channelId: e.target.value })
                    }
                    placeholder="-1001234567890"
                    required
                  />
                  <small>
                    Kanal ID'si (masalan: -1001234567890). Bot kanalda admin
                    bo'lishi kerak!
                  </small>
                </div>

                <div className="form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    value={formData.channelUsername}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        channelUsername: e.target.value,
                      })
                    }
                    placeholder="mychannel"
                    required
                  />
                  <small>
                    @ belgisisiz kanal username (masalan: BayramonaTabrik)
                  </small>
                </div>

                <div className="form-group">
                  <label>Kanal Nomi *</label>
                  <input
                    type="text"
                    value={formData.channelName}
                    onChange={(e) =>
                      setFormData({ ...formData, channelName: e.target.value })
                    }
                    placeholder="Bayramona Tabriklar"
                    required
                  />
                  <small>Kanal nomi (foydalanuvchilarga ko'rsatiladi)</small>
                </div>

                <div className="form-group">
                  <label>Icon (Emoji) *</label>
                  <input
                    type="text"
                    value={formData.channelIcon}
                    onChange={(e) =>
                      setFormData({ ...formData, channelIcon: e.target.value })
                    }
                    placeholder="📢"
                    maxLength="2"
                    required
                  />
                  <small>Emoji icon (masalan: 📢 🎉 ⭐)</small>
                </div>

                <div className="form-group">
                  <label>Tartib raqami *</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: parseInt(e.target.value),
                      })
                    }
                    placeholder="1"
                    min="1"
                    required
                  />
                  <small>Kanallar ko'rsatilish tartibi (1, 2, 3...)</small>
                </div>

                <div className="form-group">
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.isRequired}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isRequired: e.target.checked,
                        })
                      }
                      style={{ width: "auto", margin: 0 }}
                    />
                    Majburiy obuna
                  </label>
                  <small>
                    Agar belgilansa, foydalanuvchi botdan foydalanish uchun
                    kanalga obuna bo'lishi kerak
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary">
                  Qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Channels;
