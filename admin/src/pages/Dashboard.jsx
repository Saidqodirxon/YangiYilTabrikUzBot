import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { getStats } from "../utils/api";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await getStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Stats xatolik:", error);
    } finally {
      setLoading(false);
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
        <div>
          <h1>📊 Dashboard</h1>
          <p>Botning umumiy statistikasi</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats?.users || 0}</h3>
            <p>Foydalanuvchilar</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats?.approvedCongrats || 0}</h3>
            <p>Tasdiqlangan</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats?.pendingCongrats || 0}</h3>
            <p>Kutilmoqda</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📢</div>
          <div className="stat-content">
            <h3>{stats?.broadcasts?.total || 0}</h3>
            <p>Xabarlar</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📣</div>
          <div className="stat-content">
            <h3>{stats?.channels || 0}</h3>
            <p>Kanallar</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Tezkor Harakatlar</h2>
        <div className="actions-grid">
          <Link to="/congrats" className="action-card">
            <span className="action-icon">🎊</span>
            <h3>Tabriklarni Ko'rish</h3>
            <p>Kutilayotgan tabriklarni tekshirish</p>
          </Link>

          <Link to="/channels" className="action-card">
            <span className="action-icon">📢</span>
            <h3>Kanallar</h3>
            <p>Majburiy kanallarni boshqarish</p>
          </Link>

          <Link to="/broadcast" className="action-card">
            <span className="action-icon">📣</span>
            <h3>Xabar Yuborish</h3>
            <p>Barcha userlarga xabar yuborish</p>
          </Link>

          <Link to="/users" className="action-card">
            <span className="action-icon">👥</span>
            <h3>Foydalanuvchilar</h3>
            <p>Userlarni ko'rish va boshqarish</p>
          </Link>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
