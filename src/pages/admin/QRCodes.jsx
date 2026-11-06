import { useCallback, useEffect, useState } from "react";
import { getBuses, getErrorMessage } from "../../services/api";
import { publicUrl } from "../../services/utils";
import Message from "../../components/Message.jsx";
import QRCodeBox from "../../components/QRCodeBox.jsx";

export default function QRCodes() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setBuses(await getBuses());
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h2>QR Code Management</h2>
      <p>Print each QR code and attach it to the matching bus. Parents scan it to open the live tracking page.</p>
      {error && <Message type="error">{error}</Message>}
      {loading && <p>Loading...</p>}
      {!loading && !error && buses.length === 0 && (
        <Message type="info">No buses are registered yet. Add a bus under Bus Management to get its QR code.</Message>
      )}
      {buses.length > 0 && (
        <div className="panel">
          <div className="panel-title">
            <span>Bus QR Codes</span>
            <button onClick={load}>Refresh</button>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Bus Number</th><th>Bus Name</th><th>QR Code</th><th>Public Tracking URL</th></tr>
              </thead>
              <tbody>
                {buses.map((bus) => {
                  const url = publicUrl(bus.public_tracking_url);
                  return (
                    <tr key={bus.id}>
                      <td>{bus.bus_number}</td>
                      <td>{bus.bus_name}</td>
                      <td><QRCodeBox url={url} filename={`qr_${bus.bus_number}`} size={128} /></td>
                      <td><a href={url} target="_blank" rel="noreferrer">{url}</a></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
