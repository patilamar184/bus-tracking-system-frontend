import { useCallback, useEffect, useRef, useState } from "react";
import { createRoute, deleteRoute, getErrorMessage, getRoutes, updateRoute } from "../../services/api";
import { sortStops } from "../../services/utils";
import Message from "../../components/Message.jsx";

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);

  const [form, setForm] = useState(null); // { mode, id, route_name, description, stops: [...] }
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const keyCounter = useRef(0);

  const load = useCallback(async () => {
    try {
      setRoutes(await getRoutes());
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

  const blankStop = (order) => ({
    key: ++keyCounter.current,
    stop_name: "",
    latitude: "",
    longitude: "",
    stop_order: String(order),
  });

  function openAdd() {
    setFormError("");
    setForm({ mode: "add", route_name: "", description: "", stops: [blankStop(1)] });
  }

  function openEdit(route) {
    setFormError("");
    setForm({
      mode: "edit",
      id: route.id,
      route_name: route.route_name,
      description: route.description || "",
      stops: sortStops(route.stops).map((s) => ({
        key: ++keyCounter.current,
        stop_name: s.stop_name,
        latitude: String(s.latitude),
        longitude: String(s.longitude),
        stop_order: String(s.stop_order),
      })),
    });
  }

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const setStopField = (key, name, value) =>
    setForm((f) => ({ ...f, stops: f.stops.map((s) => (s.key === key ? { ...s, [name]: value } : s)) }));
  const addStop = () =>
    setForm((f) => {
      const maxOrder = f.stops.reduce((m, s) => Math.max(m, parseInt(s.stop_order, 10) || 0), 0);
      return { ...f, stops: [...f.stops, blankStop(maxOrder + 1)] };
    });
  const removeStop = (key) => setForm((f) => ({ ...f, stops: f.stops.filter((s) => s.key !== key) }));

  // Returns { payload } or { error }
  function buildPayload() {
    if (!form.route_name.trim()) return { error: "Route name is required." };
    const stops = [];
    const orders = new Set();
    for (let i = 0; i < form.stops.length; i++) {
      const s = form.stops[i];
      const n = i + 1;
      const lat = Number(s.latitude);
      const lon = Number(s.longitude);
      const order = Number(s.stop_order);
      if (!s.stop_name.trim()) return { error: `Stop ${n}: stop name is required.` };
      if (s.latitude === "" || Number.isNaN(lat) || lat < -90 || lat > 90)
        return { error: `Stop ${n}: latitude must be a number between -90 and 90.` };
      if (s.longitude === "" || Number.isNaN(lon) || lon < -180 || lon > 180)
        return { error: `Stop ${n}: longitude must be a number between -180 and 180.` };
      if (!Number.isInteger(order) || order < 1) return { error: `Stop ${n}: stop order must be a whole number, 1 or more.` };
      if (orders.has(order)) return { error: `Stop ${n}: stop order ${order} is used more than once.` };
      orders.add(order);
      stops.push({ stop_name: s.stop_name.trim(), latitude: lat, longitude: lon, stop_order: order });
    }
    return {
      payload: {
        route_name: form.route_name.trim(),
        description: form.description.trim() || null,
        stops,
      },
    };
  }

  async function submit(e) {
    e.preventDefault();
    setFormError("");
    const { payload, error: validationError } = buildPayload();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setSaving(true);
    try {
      if (form.mode === "add") await createRoute(payload);
      else await updateRoute(form.id, payload);
      setNotice({ type: "success", text: form.mode === "add" ? "Route created." : "Route updated." });
      setForm(null);
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(route) {
    const warning =
      route.bus_count > 0
        ? `\n\n${route.bus_count} bus(es) are assigned to this route and will be left with no route.`
        : "";
    if (!window.confirm(`Delete route "${route.route_name}" and all its stops?${warning}`)) return;
    try {
      await deleteRoute(route.id);
      setNotice({ type: "success", text: `Route "${route.route_name}" deleted.` });
      await load();
    } catch (err) {
      setNotice({ type: "error", text: getErrorMessage(err) });
    }
  }

  return (
    <div>
      <h2>Route Management</h2>

      {notice && (
        <Message type={notice.type} onClose={() => setNotice(null)}>
          {notice.text}
        </Message>
      )}
      {error && <Message type="error">{error}</Message>}

      <div className="toolbar">
        <button className="primary" onClick={openAdd}>Create New Route</button>
        <button onClick={load}>Refresh</button>
      </div>

      {form && (
        <div className="panel">
          <div className="panel-title">{form.mode === "add" ? "Create Route" : "Edit Route"}</div>
          <div className="panel-body">
            {formError && <Message type="error">{formError}</Message>}
            <form className="classic" onSubmit={submit}>
              <div className="row">
                <label htmlFor="route_name">Route Name</label>
                <input id="route_name" type="text" value={form.route_name} onChange={(e) => setField("route_name", e.target.value)} required />
              </div>
              <div className="row">
                <label htmlFor="description">Description</label>
                <input id="description" type="text" value={form.description} onChange={(e) => setField("description", e.target.value)} />
              </div>

              <h3>Stops</h3>
              {form.mode === "edit" && (
                <p className="hint muted">Saving replaces the route's whole stops list with the list below.</p>
              )}
              <div className="table-wrap">
                <table className="data stops">
                  <thead>
                    <tr><th style={{ width: 70 }}>Order</th><th>Stop Name</th><th style={{ width: 140 }}>Latitude</th><th style={{ width: 140 }}>Longitude</th><th style={{ width: 80 }}></th></tr>
                  </thead>
                  <tbody>
                    {form.stops.length === 0 && (
                      <tr><td colSpan={5} className="muted">No stops. Click "Add Stop".</td></tr>
                    )}
                    {form.stops.map((s) => (
                      <tr key={s.key}>
                        <td><input type="number" min="1" step="1" value={s.stop_order} onChange={(e) => setStopField(s.key, "stop_order", e.target.value)} /></td>
                        <td><input type="text" value={s.stop_name} onChange={(e) => setStopField(s.key, "stop_name", e.target.value)} /></td>
                        <td><input type="number" step="any" value={s.latitude} onChange={(e) => setStopField(s.key, "latitude", e.target.value)} /></td>
                        <td><input type="number" step="any" value={s.longitude} onChange={(e) => setStopField(s.key, "longitude", e.target.value)} /></td>
                        <td><button type="button" className="danger" onClick={() => removeStop(s.key)}>Remove</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="toolbar" style={{ marginTop: 8 }}>
                <button type="button" onClick={addStop}>Add Stop</button>
              </div>

              <div className="toolbar">
                <button className="primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Route"}</button>
                <button type="button" onClick={() => setForm(null)} disabled={saving}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && <p>Loading...</p>}
      {!loading && !error && routes.length === 0 && (
        <Message type="info">No routes exist yet. Click "Create New Route" to add one.</Message>
      )}

      {routes.map((route) => {
        const stops = sortStops(route.stops);
        return (
          <div className="panel" key={route.id}>
            <div className="panel-title">
              <span>{route.route_name}</span>
              <span>
                <button onClick={() => openEdit(route)}>Edit</button> <button onClick={() => remove(route)}>Delete</button>
              </span>
            </div>
            <div className="panel-body">
              <p style={{ marginTop: 0 }}>
                {route.description || <span className="muted">No description</span>} &nbsp;|&nbsp; Buses assigned: <strong>{route.bus_count}</strong> &nbsp;|&nbsp; Stops: <strong>{stops.length}</strong>
              </p>
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
                <p className="muted">This route has no stops.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
