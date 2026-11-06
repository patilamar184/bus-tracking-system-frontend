import { useCallback, useEffect, useState } from "react";
import {
  createBus,
  deleteBus,
  getBus,
  getBuses,
  getErrorMessage,
  getRoutes,
  updateBus,
} from "../../services/api";
import { formatDateTime, publicUrl, sortStops } from "../../services/utils";
import Message from "../../components/Message.jsx";
import QRCodeBox from "../../components/QRCodeBox.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";

export default function Buses() {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null); // { type, text }

  const [form, setForm] = useState(null); // { mode: "add" | "edit", id, device_id, values }
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState(null); // response of the bus that was just created

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const load = useCallback(async () => {
    try {
      const [busList, routeList] = await Promise.all([getBuses(), getRoutes()]);
      setBuses(busList);
      setRoutes(routeList);
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

  const routeName = (routeId) => routes.find((r) => r.id === routeId)?.route_name || "-";

  async function openDetail(id) {
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);
    try {
      setDetail(await getBus(id));
    } catch (err) {
      setDetailError(getErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  }

  function openAdd() {
    setFormError("");
    setForm({ mode: "add", values: { bus_number: "", bus_name: "", device_id: "", route_id: "" } });
  }

  function openEdit(bus) {
    setFormError("");
    setForm({
      mode: "edit",
      id: bus.id,
      device_id: bus.device_id,
      values: { bus_name: bus.bus_name, route_id: bus.route_id ?? "" },
    });
  }

  const setValue = (name, value) =>
    setForm((f) => ({ ...f, values: { ...f.values, [name]: value } }));

  async function submit(e) {
    e.preventDefault();
    setFormError("");
    const v = form.values;

    if (form.mode === "add") {
      if (!v.bus_number.trim() || !v.bus_name.trim() || !v.device_id.trim()) {
        setFormError("Bus number, bus name and ESP32 device ID are required.");
        return;
      }
      setSaving(true);
      let created;
      try {
        created = await createBus({
          bus_number: v.bus_number.trim(),
          bus_name: v.bus_name.trim(),
          device_id: v.device_id.trim(),
        });
      } catch (err) {
        setFormError(getErrorMessage(err));
        setSaving(false);
        return;
      }
      // The create endpoint has no route field, so the route is assigned with a second call.
      let routeError = "";
      if (v.route_id !== "") {
        try {
          await updateBus(created.id, { route_id: Number(v.route_id) });
        } catch (err) {
          routeError = getErrorMessage(err);
        }
      }
      setNewKey(created);
      setForm(null);
      setSaving(false);
      setNotice(
        routeError
          ? { type: "warn", text: `Bus registered, but assigning the route failed: ${routeError}` }
          : { type: "success", text: "Bus registered successfully." }
      );
      await load();
    } else {
      if (!v.bus_name.trim()) {
        setFormError("Bus name is required.");
        return;
      }
      setSaving(true);
      try {
        await updateBus(form.id, {
          bus_name: v.bus_name.trim(),
          route_id: v.route_id === "" ? null : Number(v.route_id),
        });
        setForm(null);
        setNotice({ type: "success", text: "Bus updated." });
        await load();
        if (detail && detail.id === form.id) openDetail(form.id);
      } catch (err) {
        setFormError(getErrorMessage(err));
      } finally {
        setSaving(false);
      }
    }
  }

  async function remove(bus) {
    if (
      !window.confirm(
        `Delete bus ${bus.bus_number}?\n\nIts latest location and ESP32 device record will also be deleted. This cannot be undone.`
      )
    )
      return;
    try {
      await deleteBus(bus.id);
      if (detail && detail.id === bus.id) setDetail(null);
      setNotice({ type: "success", text: `Bus ${bus.bus_number} deleted.` });
      await load();
    } catch (err) {
      setNotice({ type: "error", text: getErrorMessage(err) });
    }
  }

  return (
    <div>
      <h2>Bus Management</h2>

      {notice && (
        <Message type={notice.type} onClose={() => setNotice(null)}>
          {notice.text}
        </Message>
      )}

      {newKey && (
        <Message type="warn" onClose={() => setNewKey(null)}>
          <strong>Device API key for {newKey.bus_number} (device {newKey.device_id}):</strong>
          <div className="key-box">{newKey.device_api_key}</div>
          Copy this key now and program it into the ESP32 (<code>X-API-Key</code> header). It is shown only once and
          cannot be retrieved later.
        </Message>
      )}

      {error && <Message type="error">{error}</Message>}

      <div className="toolbar">
        <button className="primary" onClick={openAdd}>Add New Bus</button>
        <button onClick={load}>Refresh</button>
      </div>

      {form && (
        <div className="panel">
          <div className="panel-title">{form.mode === "add" ? "Register New Bus" : "Edit Bus"}</div>
          <div className="panel-body">
            {formError && <Message type="error">{formError}</Message>}
            <form className="classic" onSubmit={submit}>
              {form.mode === "add" && (
                <div className="row">
                  <label htmlFor="bus_number">Bus Number</label>
                  <input id="bus_number" type="text" value={form.values.bus_number} onChange={(e) => setValue("bus_number", e.target.value)} required />
                </div>
              )}
              <div className="row">
                <label htmlFor="bus_name">Bus Name</label>
                <input id="bus_name" type="text" value={form.values.bus_name} onChange={(e) => setValue("bus_name", e.target.value)} required />
              </div>
              <div className="row">
                <label htmlFor="device_id">ESP32 Device ID</label>
                {form.mode === "add" ? (
                  <input id="device_id" type="text" value={form.values.device_id} onChange={(e) => setValue("device_id", e.target.value)} required />
                ) : (
                  <>
                    <input id="device_id" type="text" value={form.device_id} disabled />
                    <span className="hint">Cannot be changed.</span>
                  </>
                )}
              </div>
              <div className="row">
                <label htmlFor="route_id">Assigned Route</label>
                <select id="route_id" value={form.values.route_id} onChange={(e) => setValue("route_id", e.target.value)}>
                  <option value="">-- No route --</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>{r.route_name}</option>
                  ))}
                </select>
              </div>
              <div className="row">
                <label></label>
                <button className="primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
                <button type="button" onClick={() => setForm(null)} disabled={saving}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && <p>Loading...</p>}
      {!loading && !error && buses.length === 0 && (
        <Message type="info">No buses are registered yet. Click "Add New Bus" to register one.</Message>
      )}

      {buses.length > 0 && (
        <div className="panel">
          <div className="panel-title">Registered Buses ({buses.length})</div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Bus Number</th>
                  <th>Bus Name</th>
                  <th>Device ID</th>
                  <th>Device Status</th>
                  <th>Last Heartbeat</th>
                  <th>Assigned Route</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {buses.map((bus) => (
                  <tr key={bus.id} className={detail?.id === bus.id ? "selected" : ""}>
                    <td>{bus.bus_number}</td>
                    <td>{bus.bus_name}</td>
                    <td>{bus.device_id}</td>
                    <td><StatusBadge status={bus.device_status} /></td>
                    <td>{formatDateTime(bus.last_heartbeat)}</td>
                    <td>{routeName(bus.route_id)}</td>
                    <td className="actions">
                      <button onClick={() => openDetail(bus.id)}>View</button>
                      <button onClick={() => openEdit(bus)}>Edit</button>
                      <button className="danger" onClick={() => remove(bus)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detailLoading && <p>Loading bus details...</p>}
      {detailError && <Message type="error">{detailError}</Message>}
      {detail && <BusDetail bus={detail} onRefresh={() => openDetail(detail.id)} onClose={() => setDetail(null)} />}
    </div>
  );
}

function BusDetail({ bus, onRefresh, onClose }) {
  const url = publicUrl(bus.public_tracking_url);
  const loc = bus.location;
  const stops = bus.route ? sortStops(bus.route.stops) : [];

  return (
    <div className="panel">
      <div className="panel-title">
        <span>Bus Details - {bus.bus_number}</span>
        <span>
          <button onClick={onRefresh}>Refresh</button> <button onClick={onClose}>Close</button>
        </span>
      </div>
      <div className="panel-body">
        <table className="data info">
          <tbody>
            <tr><th>Bus Number</th><td>{bus.bus_number}</td></tr>
            <tr><th>Bus Name</th><td>{bus.bus_name}</td></tr>
            <tr><th>ESP32 Device ID</th><td>{bus.device_id}</td></tr>
            <tr><th>Device Status</th><td><StatusBadge status={bus.device_status} /></td></tr>
            <tr><th>Last Heartbeat</th><td>{formatDateTime(bus.last_heartbeat)}</td></tr>
            <tr><th>Assigned Route</th><td>{bus.route ? bus.route.route_name : "No route assigned"}</td></tr>
          </tbody>
        </table>

        <h3 style={{ marginTop: 12 }}>Latest GPS Location</h3>
        {loc ? (
          <table className="data info">
            <tbody>
              <tr><th>Latitude / Longitude</th><td>{loc.latitude}, {loc.longitude}</td></tr>
              <tr><th>Speed</th><td>{loc.speed_kmph} km/h</td></tr>
              <tr><th>Altitude</th><td>{loc.altitude_m ?? "-"} {loc.altitude_m != null && "m"}</td></tr>
              <tr><th>Satellites</th><td>{loc.satellites ?? "-"}</td></tr>
              <tr><th>Updated At</th><td>{formatDateTime(loc.updated_at)}</td></tr>
            </tbody>
          </table>
        ) : (
          <Message type="warn">GPS location unavailable. No location has been received from this bus yet.</Message>
        )}

        <h3 style={{ marginTop: 12 }}>Route Stops</h3>
        {stops.length > 0 ? (
          <table className="data">
            <thead><tr><th>Order</th><th>Stop Name</th><th>Latitude</th><th>Longitude</th></tr></thead>
            <tbody>
              {stops.map((s) => (
                <tr key={s.id}><td>{s.stop_order}</td><td>{s.stop_name}</td><td>{s.latitude}</td><td>{s.longitude}</td></tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">{bus.route ? "This route has no stops." : "No route assigned."}</p>
        )}

        <h3 style={{ marginTop: 12 }}>QR Code</h3>
        <QRCodeBox url={url} filename={`qr_${bus.bus_number}`} />
        <p>Public tracking URL: <a href={url} target="_blank" rel="noreferrer">{url}</a></p>
      </div>
    </div>
  );
}
