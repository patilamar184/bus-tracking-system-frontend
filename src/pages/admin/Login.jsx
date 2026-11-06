import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { adminLogin, getErrorMessage } from "../../services/api";
import { isLoggedIn, setToken } from "../../services/auth";
import Message from "../../components/Message.jsx";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expired] = useState(() => {
    const flag = sessionStorage.getItem("session_expired") === "1";
    sessionStorage.removeItem("session_expired");
    return flag;
  });

  if (isLoggedIn()) return <Navigate to="/admin" replace />;

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminLogin(username.trim(), password);
      setToken(res.access_token);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="header">
        <div>
          <h1>School Bus Tracking System</h1>
          <div className="sub">Administration Panel</div>
        </div>
      </div>
      <div className="login-box">
        <div className="panel">
          <div className="panel-title">Administrator Login</div>
          <div className="panel-body">
            {expired && <Message type="warn">Your session has expired. Please log in again.</Message>}
            {error && <Message type="error">{error}</Message>}
            <form className="classic" onSubmit={submit}>
              <div className="row">
                <label htmlFor="username">Username</label>
                <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
              </div>
              <div className="row">
                <label htmlFor="password">Password</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="row">
                <label></label>
                <button className="primary" type="submit" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
