import { useCallback, useEffect, useState } from "react";
import { getDashboard, getErrorMessage } from "../../services/api";
import Message from "../../components/Message.jsx";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState(null);

  const load = useCallback(async () => {
    try {
      setStats(await getDashboard());
      setError("");
      setRefreshedAt(new Date());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000); // keeps online/offline counts current
    return () => clearInterval(timer);
  }, [load]);

  return (
    <div>
      <h2>Dashboard</h2>
      {error && <Message type="error">{error}</Message>}
      {loading && <p>Loading...</p>}
      {stats && (
        <div className="panel" style={{ maxWidth: 520 }}>
          <div className="panel-title">
            <span>System Summary</span>
            <button onClick={load}>Refresh</button>
          </div>
          <table className="data info">
            <tbody>
              <tr><th>Total Buses</th><td>{stats.total_buses}</td></tr>
              <tr><th>Online Buses</th><td className="status-online">{stats.online_buses}</td></tr>
              <tr><th>Offline Buses</th><td className="status-offline">{stats.offline_buses}</td></tr>
              <tr><th>Total Routes</th><td>{stats.total_routes}</td></tr>
            </tbody>
          </table>
          <div className="panel-body muted">
            A bus is online if its device sent a heartbeat in the last 60 seconds.
            {refreshedAt && <> Last refreshed: {refreshedAt.toLocaleTimeString()}.</>}
          </div>
        </div>
      )}
    </div>
  );
}
