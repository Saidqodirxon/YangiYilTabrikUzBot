import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getUsers } from "../utils/api";
import axios from "axios";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchUsers(currentPage, searchQuery, filterStatus);
  }, [currentPage, searchQuery, filterStatus]);

  const fetchUsers = async (page, search = "", filter = "all") => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:3000/api/users?page=${page}&search=${search}&filter=${filter}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        const { users, currentPage, totalPages, totalUsers } =
          response.data.data;
        setUsers(users);
        setCurrentPage(currentPage);
        setTotalPages(totalPages);
        setTotalUsers(totalUsers);
      }
    } catch (error) {
      console.error("Users xatolik:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId, isBlocked) => {
    if (
      !confirm(
        isBlocked ? "Userni blokdan chiqarasizmi?" : "Userni bloklaysizmi?"
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const endpoint = isBlocked
        ? `http://localhost:3000/api/users/${userId}/unblock`
        : `http://localhost:3000/api/users/${userId}/block`;

      const response = await axios.post(
        endpoint,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert("✅ " + response.data.message);
        fetchUsers(currentPage, searchQuery, filterStatus);
      }
    } catch (error) {
      alert("❌ Xatolik: " + (error.response?.data?.message || error.message));
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>👥 Foydalanuvchilar</h1>
          <p>Jami: {totalUsers} ta</p>
        </div>
      </div>

      {/* Search va Filter */}
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "10px",
          marginBottom: "20px",
          display: "flex",
          gap: "15px",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="🔍 ID, Ism, Familiya yoki Username orqali qidirish..."
            value={searchQuery}
            onChange={handleSearch}
            style={{
              width: "100%",
              padding: "10px 15px",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          />
        </div>
        <div>
          <select
            value={filterStatus}
            onChange={handleFilterChange}
            style={{
              padding: "10px 15px",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <option value="all">📊 Hammasi</option>
            <option value="active">✅ Faol</option>
            <option value="blocked">🚫 Bloklangan</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="spinner"></div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">👥</span>
          <h2>Foydalanuvchilar topilmadi</h2>
          <p>Qidiruv so'roviga mos natija yo'q</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ism</th>
                  <th>User ID</th>
                  <th>Username</th>
                  <th>Joylashuv</th>
                  <th>Ro'yxatdan o'tgan</th>
                  <th>Holat</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <strong>{user.firstName}</strong>
                    </td>
                    <td>
                      <code>{user.userId}</code>
                    </td>
                    <td>@{user.username || "yo'q"}</td>
                    <td>{user.location || "-"}</td>
                    <td>
                      {new Date(user.createdAt).toLocaleDateString("uz-UZ")}
                    </td>
                    <td>
                      {user.is_block ? (
                        <span
                          className="badge"
                          style={{
                            background: "#FEE2E2",
                            color: "#991B1B",
                            padding: "4px 12px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          🚫 Bloklangan
                        </span>
                      ) : (
                        <span
                          className="badge"
                          style={{
                            background: "#D1FAE5",
                            color: "#065F46",
                            padding: "4px 12px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          ✅ Faol
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() =>
                          handleBlockUser(user.userId, user.is_block)
                        }
                        className={
                          user.is_block ? "btn btn-success" : "btn btn-danger"
                        }
                        style={{
                          padding: "6px 12px",
                          fontSize: "13px",
                          marginRight: "5px",
                        }}
                      >
                        {user.is_block ? "🔓 Blokdan chiqarish" : "🚫 Bloklash"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              {currentPage > 1 && (
                <button
                  className="btn btn-secondary"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  style={{ marginRight: "10px" }}
                >
                  ← Oldingi
                </button>
              )}

              <span style={{ margin: "0 15px" }}>
                Sahifa {currentPage} / {totalPages}
              </span>

              {currentPage < totalPages && (
                <button
                  className="btn btn-secondary"
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Keyingi →
                </button>
              )}
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

export default Users;
