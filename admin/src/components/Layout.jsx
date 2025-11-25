import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Layout({ children }) {
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path) => (location.pathname === path ? "active" : "");

  const handleLogout = () => {
    if (window.confirm("Chiqishni xohlaysizmi?")) {
      logout();
    }
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>🎉 Yangi Yil Bot</h2>
          <p style={{ fontSize: "12px", color: "#6B7280", marginTop: "5px" }}>
            Admin Panel
          </p>
        </div>
        <ul className="sidebar-menu">
          <li className={isActive("/")}>
            <Link to="/">
              <span>📊</span> Dashboard
            </Link>
          </li>
          <li className={isActive("/users")}>
            <Link to="/users">
              <span>👥</span> Foydalanuvchilar
            </Link>
          </li>
          <li className={isActive("/congrats")}>
            <Link to="/congrats">
              <span>🎊</span> Tabriklar
            </Link>
          </li>
          <li className={isActive("/channels")}>
            <Link to="/channels">
              <span>📢</span> Kanallar
            </Link>
          </li>
          <li className={isActive("/certificates")}>
            <Link to="/certificates">
              <span>🎨</span> Rasmli tabriknomalar
            </Link>
          </li>
          <li className={isActive("/broadcast")}>
            <Link to="/broadcast">
              <span>📣</span> Xabar yuborish
            </Link>
          </li>
          <li className={isActive("/admins")}>
            <Link to="/admins">
              <span>👨‍💼</span> Adminlar
            </Link>
          </li>
          <li className={isActive("/settings")}>
            <Link to="/settings">
              <span>⚙️</span> Sozlamalar
            </Link>
          </li>
          <li>
            <a href="#" onClick={handleLogout} style={{ color: "#EF4444" }}>
              <span>🚪</span> Chiqish
            </a>
          </li>
        </ul>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}

export default Layout;
