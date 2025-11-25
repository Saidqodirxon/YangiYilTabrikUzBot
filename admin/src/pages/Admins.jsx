import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getAdmins, addAdmin, updateAdmin, deleteAdmin } from "../utils/api";

function Admins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [formData, setFormData] = useState({
    userId: "",
    firstName: "",
    lastName: "",
    username: "",
    role: "moderator",
    permissions: {
      canApprove: true,
      canBlock: true,
      canBroadcast: false,
      canManageChannels: false,
      canManageAdmins: false,
      canManageTemplates: false,
    },
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await getAdmins();
      console.log("Admins response:", response);
      const adminData = response.data?.data || response.data || response;
      setAdmins(adminData);
      setLoading(false);
    } catch (error) {
      console.error("Adminlarni yuklashda xatolik:", error);
      alert("Adminlarni yuklashda xatolik: " + error.message);
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addAdmin(formData);
      setShowModal(false);
      resetForm();
      fetchAdmins();
      alert("Admin muvaffaqiyatli qo'shildi");
    } catch (error) {
      alert(error.response?.data?.message || "Xatolik yuz berdi");
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await updateAdmin(currentAdmin.userId, formData);
      setShowEditModal(false);
      resetForm();
      fetchAdmins();
      alert("Admin muvaffaqiyatli yangilandi");
    } catch (error) {
      alert(error.response?.data?.message || "Xatolik yuz berdi");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Adminni o'chirishga ishonchingiz komilmi?")) return;

    try {
      await deleteAdmin(userId);
      fetchAdmins();
      alert("Admin muvaffaqiyatli o'chirildi");
    } catch (error) {
      alert(error.response?.data?.message || "Xatolik yuz berdi");
    }
  };

  const openEditModal = (admin) => {
    setCurrentAdmin(admin);
    setFormData({
      userId: admin.userId,
      firstName: admin.firstName,
      lastName: admin.lastName || "",
      username: admin.username || "",
      role: admin.role,
      permissions: admin.permissions,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      userId: "",
      firstName: "",
      lastName: "",
      username: "",
      role: "moderator",
      permissions: {
        canApprove: true,
        canBlock: true,
        canBroadcast: false,
        canManageChannels: false,
        canManageAdmins: false,
        canManageTemplates: false,
      },
    });
    setCurrentAdmin(null);
  };

  const handlePermissionChange = (permission) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [permission]: !formData.permissions[permission],
      },
    });
  };

  const getRoleBadge = (role) => {
    const colors = {
      superadmin: "badge-danger",
      admin: "badge-warning",
      moderator: "badge-info",
    };
    return colors[role] || "badge-secondary";
  };

  const getRoleText = (role) => {
    const texts = {
      superadmin: "Super Admin",
      admin: "Admin",
      moderator: "Moderator",
    };
    return texts[role] || role;
  };

  if (loading) {
    return <div className="loading">Yuklanmoqda...</div>;
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>👥 Adminlar</h1>
          <p>Admin huquqlarini boshqarish</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          ➕ Yangi Admin Qo'shish
        </button>
      </div>

      {loading ? (
        <div className="spinner"></div>
      ) : admins.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">👥</span>
          <h2>Adminlar yo'q</h2>
          <p>Birinchi adminni qo'shing</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Rol</th>
                <th>Huquqlar</th>
                <th>Status</th>
                <th>Qo'shilgan</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.userId}>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px",
                      }}
                    >
                      <strong style={{ fontSize: "15px" }}>
                        {admin.firstName} {admin.lastName || ""}
                      </strong>
                      <div style={{ fontSize: "13px", color: "#6B7280" }}>
                        <span>@{admin.username || "yo'q"}</span>
                        <span style={{ margin: "0 8px" }}>•</span>
                        <code
                          style={{
                            background: "#F3F4F6",
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {admin.userId}
                        </code>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getRoleBadge(admin.role)}`}>
                      {getRoleText(admin.role)}
                    </span>
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "5px",
                        maxWidth: "300px",
                      }}
                    >
                      {admin.permissions.canApprove && (
                        <span
                          style={{
                            background: "#DCFCE7",
                            color: "#166534",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          ✅ Tasdiqlash
                        </span>
                      )}
                      {admin.permissions.canBlock && (
                        <span
                          style={{
                            background: "#FEE2E2",
                            color: "#991B1B",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          🚫 Bloklash
                        </span>
                      )}
                      {admin.permissions.canBroadcast && (
                        <span
                          style={{
                            background: "#DBEAFE",
                            color: "#1E40AF",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          📢 Xabar
                        </span>
                      )}
                      {admin.permissions.canManageChannels && (
                        <span
                          style={{
                            background: "#E0E7FF",
                            color: "#3730A3",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          📺 Kanal
                        </span>
                      )}
                      {admin.permissions.canManageAdmins && (
                        <span
                          style={{
                            background: "#FEF3C7",
                            color: "#92400E",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          👥 Admin
                        </span>
                      )}
                      {admin.permissions.canManageTemplates && (
                        <span
                          style={{
                            background: "#FCE7F3",
                            color: "#831843",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          🎨 Shablon
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        admin.isActive ? "badge-success" : "badge-secondary"
                      }`}
                    >
                      {admin.isActive ? "🟢 Faol" : "⚪ Nofaol"}
                    </span>
                  </td>
                  <td style={{ color: "#6B7280", fontSize: "14px" }}>
                    {new Date(admin.createdAt).toLocaleDateString("uz-UZ", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => openEditModal(admin)}
                        title="Tahrirlash"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(admin.userId)}
                        disabled={admin.role === "superadmin"}
                        style={{
                          opacity: admin.role === "superadmin" ? 0.5 : 1,
                        }}
                        title={
                          admin.role === "superadmin"
                            ? "Superadminni o'chirish mumkin emas"
                            : "O'chirish"
                        }
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}
          >
            <div className="modal-header">
              <h2>➕ Yangi Admin Qo'shish</h2>
              <button className="close" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Telegram User ID *</label>
                  <input
                    type="number"
                    value={formData.userId}
                    onChange={(e) =>
                      setFormData({ ...formData, userId: e.target.value })
                    }
                    placeholder="1234567890"
                    required
                  />
                  <small>Foydalanuvchining Telegram ID raqami</small>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "15px",
                  }}
                >
                  <div className="form-group">
                    <label>Ism *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      placeholder="Ahmad"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Familiya</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      placeholder="Ahmadov"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder="username"
                  />
                  <small>@ belgisisiz</small>
                </div>

                <div className="form-group">
                  <label>Rol *</label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    required
                  >
                    <option value="moderator">👮 Moderator</option>
                    <option value="admin">👨‍💼 Admin</option>
                    <option value="superadmin">👑 Super Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label
                    style={{
                      marginBottom: "12px",
                      display: "block",
                      fontWeight: "600",
                    }}
                  >
                    Huquqlar
                  </label>
                  <div style={{ display: "grid", gap: "10px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px",
                        background: "#F9FAFB",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#F3F4F6")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "#F9FAFB")
                      }
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.canApprove}
                        onChange={() => handlePermissionChange("canApprove")}
                        style={{ width: "auto", margin: 0, cursor: "pointer" }}
                      />
                      <span style={{ flex: 1 }}>
                        <strong>✅ Tabriklarni tasdiqlash</strong>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6B7280",
                            marginTop: "2px",
                          }}
                        >
                          Yuborilgan tabriklarni ko'rish va tasdiqlash
                        </div>
                      </span>
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px",
                        background: "#F9FAFB",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#F3F4F6")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "#F9FAFB")
                      }
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.canBlock}
                        onChange={() => handlePermissionChange("canBlock")}
                        style={{ width: "auto", margin: 0, cursor: "pointer" }}
                      />
                      <span style={{ flex: 1 }}>
                        <strong>🚫 Userlarni bloklash</strong>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6B7280",
                            marginTop: "2px",
                          }}
                        >
                          Foydalanuvchilarni bloklab/blokdan chiqarish
                        </div>
                      </span>
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px",
                        background: "#F9FAFB",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#F3F4F6")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "#F9FAFB")
                      }
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.canBroadcast}
                        onChange={() => handlePermissionChange("canBroadcast")}
                        style={{ width: "auto", margin: 0, cursor: "pointer" }}
                      />
                      <span style={{ flex: 1 }}>
                        <strong>📢 Xabar yuborish</strong>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6B7280",
                            marginTop: "2px",
                          }}
                        >
                          Barcha userlarga broadcast xabar yuborish
                        </div>
                      </span>
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px",
                        background: "#F9FAFB",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#F3F4F6")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "#F9FAFB")
                      }
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.canManageChannels}
                        onChange={() =>
                          handlePermissionChange("canManageChannels")
                        }
                        style={{ width: "auto", margin: 0, cursor: "pointer" }}
                      />
                      <span style={{ flex: 1 }}>
                        <strong>📺 Kanallarni boshqarish</strong>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6B7280",
                            marginTop: "2px",
                          }}
                        >
                          Majburiy obuna kanallarini qo'shish/o'chirish
                        </div>
                      </span>
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px",
                        background: "#F9FAFB",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#F3F4F6")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "#F9FAFB")
                      }
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.canManageAdmins}
                        onChange={() =>
                          handlePermissionChange("canManageAdmins")
                        }
                        style={{ width: "auto", margin: 0, cursor: "pointer" }}
                      />
                      <span style={{ flex: 1 }}>
                        <strong>👥 Adminlarni boshqarish</strong>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6B7280",
                            marginTop: "2px",
                          }}
                        >
                          Yangi admin qo'shish va tahrirlash
                        </div>
                      </span>
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px",
                        background: "#F9FAFB",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#F3F4F6")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "#F9FAFB")
                      }
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.canManageTemplates}
                        onChange={() =>
                          handlePermissionChange("canManageTemplates")
                        }
                        style={{ width: "auto", margin: 0, cursor: "pointer" }}
                      />
                      <span style={{ flex: 1 }}>
                        <strong>🎨 Shablonlarni boshqarish</strong>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6B7280",
                            marginTop: "2px",
                          }}
                        >
                          Sertifikat shablonlarini yaratish/tahrirlash
                        </div>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
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

      {/* Edit Modal - O'zgartirish kerak */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}
          >
            <div className="modal-header">
              <h2>✏️ Adminni Tahrirlash</h2>
              <button className="close" onClick={() => setShowEditModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>User ID</label>
                  <input
                    type="number"
                    value={formData.userId}
                    disabled
                    style={{ background: "#F3F4F6", cursor: "not-allowed" }}
                  />
                  <small>User ID o'zgartirib bo'lmaydi</small>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "15px",
                  }}
                >
                  <div className="form-group">
                    <label>Ism *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Familiya</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder="username"
                  />
                  <small>@ belgisisiz</small>
                </div>

                <div className="form-group">
                  <label>Rol *</label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    required
                  >
                    <option value="moderator">👮 Moderator</option>
                    <option value="admin">👨‍💼 Admin</option>
                    <option value="superadmin">👑 Super Admin</option>
                  </select>
                </div>

                {/* Huquqlar - Add modal bilan bir xil */}
                <div className="form-group">
                  <label
                    style={{
                      marginBottom: "12px",
                      display: "block",
                      fontWeight: "600",
                    }}
                  >
                    Huquqlar
                  </label>
                  <div style={{ display: "grid", gap: "10px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px",
                        background: "#F9FAFB",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.canApprove}
                        onChange={() => handlePermissionChange("canApprove")}
                        style={{ width: "auto", margin: 0, cursor: "pointer" }}
                      />
                      <span style={{ flex: 1 }}>
                        <strong>✅ Tabriklarni tasdiqlash</strong>
                      </span>
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px",
                        background: "#F9FAFB",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.canBlock}
                        onChange={() => handlePermissionChange("canBlock")}
                        style={{ width: "auto", margin: 0, cursor: "pointer" }}
                      />
                      <span style={{ flex: 1 }}>
                        <strong>🚫 Userlarni bloklash</strong>
                      </span>
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px",
                        background: "#F9FAFB",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.canBroadcast}
                        onChange={() => handlePermissionChange("canBroadcast")}
                        style={{ width: "auto", margin: 0, cursor: "pointer" }}
                      />
                      <span style={{ flex: 1 }}>
                        <strong>📢 Xabar yuborish</strong>
                      </span>
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px",
                        background: "#F9FAFB",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.canManageChannels}
                        onChange={() =>
                          handlePermissionChange("canManageChannels")
                        }
                        style={{ width: "auto", margin: 0, cursor: "pointer" }}
                      />
                      <span style={{ flex: 1 }}>
                        <strong>📺 Kanallarni boshqarish</strong>
                      </span>
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px",
                        background: "#F9FAFB",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.canManageAdmins}
                        onChange={() =>
                          handlePermissionChange("canManageAdmins")
                        }
                        style={{ width: "auto", margin: 0, cursor: "pointer" }}
                      />
                      <span style={{ flex: 1 }}>
                        <strong>👥 Adminlarni boshqarish</strong>
                      </span>
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px",
                        background: "#F9FAFB",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.canManageTemplates}
                        onChange={() =>
                          handlePermissionChange("canManageTemplates")
                        }
                        style={{ width: "auto", margin: 0, cursor: "pointer" }}
                      />
                      <span style={{ flex: 1 }}>
                        <strong>🎨 Shablonlarni boshqarish</strong>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                >
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary">
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Admins;
