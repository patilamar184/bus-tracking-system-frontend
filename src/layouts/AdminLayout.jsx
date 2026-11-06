import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, isLoggedIn } from "../services/auth";

export default function AdminLayout() {
  const navigate = useNavigate();

  if (!isLoggedIn()) {
    return <Navigate to="/admin/login" replace />;
  }

  function logout() {
    clearToken();
    navigate("/admin/login");
  }

  return (
    <div>
      <div className="header">
        <div>
          <h1>School Bus Tracking System</h1>
          <div className="sub">Administration Panel</div>
        </div>
        <div className="user">
          <span>Administrator</span>
          <button onClick={logout}>Logout</button>
        </div>
      </div>
      <div className="layout">
        <div className="sidebar">
          <div className="menu-title">Main Menu</div>
          <NavLink to="/admin" end>Dashboard</NavLink>
          <NavLink to="/admin/buses">Bus Management</NavLink>
          <NavLink to="/admin/routes">Route Management</NavLink>
          <NavLink to="/admin/qr-codes">QR Codes</NavLink>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </div>
      <div className="footer">School Bus Tracking System</div>
    </div>
  );
}
