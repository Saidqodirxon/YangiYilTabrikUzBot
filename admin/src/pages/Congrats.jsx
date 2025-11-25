import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getCongrats, approveCongrats, rejectCongrats } from "../utils/api";

function Congrats() {
  const [congrats, setCongrats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCongrats();
  }, []);

  const fetchCongrats = async () => {
    setLoading(true);
    try {
      const response = await getCongrats();
      console.log("Congrats response:", response.data);
      if (response.data.success) {
        setCongrats(response.data.data);
      }
    } catch (error) {
      console.error("Congrats xatolik:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Tabrikni tasdiqlaysizmi?")) return;

    try {
      const response = await approveCongrats(id);
      if (response.data.success) {
        alert("✅ " + response.data.message);
        fetchCongrats();
      }
    } catch (error) {
      alert("❌ Xatolik: " + (error.response?.data?.message || error.message));
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt(
      "Tabrikni rad etish sababi:",
      "Qoidalarga mos kelmagan"
    );

    if (reason === null) return; // Cancel bosilgan

    try {
      const response = await rejectCongrats(
        id,
        reason || "Qoidalarga mos kelmagan"
      );
      if (response.data.success) {
        alert("✅ " + response.data.message);
        fetchCongrats();
      }
    } catch (error) {
      alert("❌ Xatolik: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>🎊 Tabriklar</h1>
          <p>Kutilayotgan tabriklarni tasdiqlash</p>
        </div>
      </div>

      {loading ? (
        <div className="spinner"></div>
      ) : congrats.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🎊</span>
          <h2>Kutilayotgan tabriklar yo'q</h2>
          <p>Barcha tabriklar tasdiqlangan</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {congrats.map((item) => (
            <div
              key={item._id}
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {/* User Info */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                  paddingBottom: "16px",
                  borderBottom: "2px solid #F3F4F6",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "20px",
                      fontWeight: "bold",
                    }}
                  >
                    {(item.firstName || "U")[0]}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "18px" }}>
                      {item.firstName || "Noma'lum"}
                    </h3>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#6B7280",
                        marginTop: "4px",
                      }}
                    >
                      <span>@{item.username || "N/A"}</span>
                      <span style={{ margin: "0 8px" }}>•</span>
                      <code
                        style={{
                          background: "#F3F4F6",
                          padding: "2px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        ID: {item.userId || "N/A"}
                      </code>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="badge badge-warning">
                    {item.messageType === "text"
                      ? "📝 Matn"
                      : item.messageType === "photo"
                      ? "🖼 Rasm"
                      : "🎥 Video"}
                  </span>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#9CA3AF",
                      marginTop: "4px",
                    }}
                  >
                    {new Date(item.createdAt).toLocaleString("uz-UZ")}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div
                style={{
                  background: "#F9FAFB",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "20px",
                  minHeight: "60px",
                }}
              >
                {item.messageType === "text" ? (
                  <div
                    style={{
                      fontSize: "15px",
                      lineHeight: "1.6",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {item.message || (
                      <em style={{ color: "#9CA3AF" }}>Matn yo'q</em>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <span style={{ fontSize: "48px" }}>
                      {item.messageType === "photo" ? "🖼️" : "🎥"}
                    </span>
                    <p style={{ color: "#6B7280", marginTop: "12px" }}>
                      {item.messageType === "photo"
                        ? "Rasm yuborilgan"
                        : "Video yuborilgan"}
                    </p>
                    {item.caption && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "12px",
                          background: "white",
                          borderRadius: "6px",
                        }}
                      >
                        <strong>Caption:</strong> {item.caption}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  className="btn btn-danger"
                  onClick={() => handleReject(item._id)}
                  style={{ minWidth: "140px" }}
                >
                  ❌ Rad etish
                </button>
                <button
                  className="btn btn-success"
                  onClick={() => handleApprove(item._id)}
                  style={{ minWidth: "140px" }}
                >
                  ✅ Tasdiqlash
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

export default Congrats;
