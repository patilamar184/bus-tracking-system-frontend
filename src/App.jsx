import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout.jsx";
import Login from "./pages/admin/Login.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import Buses from "./pages/admin/Buses.jsx";
import RoutesPage from "./pages/admin/Routes.jsx";
import QRCodes from "./pages/admin/QRCodes.jsx";
import Track from "./pages/parent/Track.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />

      {/* Parent view: no login, identified only by the QR token */}
      <Route path="/track/:token" element={<Track />} />

      {/* Admin view */}
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="buses" element={<Buses />} />
        <Route path="routes" element={<RoutesPage />} />
        <Route path="qr-codes" element={<QRCodes />} />
      </Route>

      <Route
        path="*"
        element={
          <div className="parent-page">
            <div className="msg error">Page not found.</div>
          </div>
        }
      />
    </Routes>
  );
}
