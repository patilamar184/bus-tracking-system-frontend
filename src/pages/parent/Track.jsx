import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getErrorMessage, getEta, getTrack } from "../../services/api";
import { formatDateTime, sortStops } from "../../services/utils";
import Message from "../../components/Message.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import TrackMap from "../../components/TrackMap.jsx";

const POLL_MS = 5000;

export default function Track() {
  const { token } = useParams();

  const [data, setData] = useState(null);
  const [state, setState] = useState("loading"); // loading | ok | invalid | error
  const [error, setError] = useState("");
  const [checkedAt, setCheckedAt] = useState(null);

  const [selectedStopId, setSelectedStopId] = useState(null);
  const [eta, setEta] = useState(null);
  const [etaError, setEtaError] = useState("");
  const [recenter, setRecenter] = useState(0);

  // Poll the backend for the bus every 5 seconds (one request at a time).
  useEffect(() => {
    let cancelled = false;
    let timer;

    async function load() {
      try {
        const res = await getTrack(token);
        if (cancelled) return;
        setData(res);
        setState("ok");
        setError("");
        setCheckedAt(new Date());
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 404) {
          setData(null);
          setState("invalid"); // bad QR code: stop polling
          return;
        }
        setError(getErrorMessage(err));
        setState((prev) => (prev === "loading" ? "error" : prev));
      }
      timer = setTimeout(load, POLL_MS);
    }

    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [token]);

  // Fetch the ETA for the selected stop, refreshed every 5 seconds.
  useEffect(() => {
    setEta(null);
    setEtaError("");
    if (selectedStopId == null) return undefined;
    let cancelled = false;
    let timer;

    async function loadEta() {
      try {
        const res = await getEta(token, selectedStopId);
        if (cancelled) return;
        setEta(res);
        setEtaError("");
      } catch (err) {
        if (cancelled) return;
        setEta(null);
        setEtaError(getErrorMessage(err));
      }
      timer = setTimeout(loadEta, POLL_MS);
    }

    loadEta();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [token, selectedStopId]);

  const stops = useMemo(() => sortStops(data?.route?.stops || []), [data]);
  const selectedStop = stops.find((s) => s.id === selectedStopId) || null;

  return (
    <div>
      <div className="header">
        <div>
          <h1>School Bus Tracking</h1>
          <div className="sub">Live bus location</div>
        </div>
      </div>

      <div className="parent-page">
        {state === "loading" && <p>Loading bus information...</p>}

        {state === "invalid" && (
          <Message type="error">
            This tracking link is not valid. The QR code may be wrong, or the bus is no longer registered. Please scan
            the QR code on the bus again or contact the school.
          </Message>
        )}

        {state === "error" && !data && (
          <Message type="error">
            Could not load bus information: {error} <br />
            Retrying automatically every {POLL_MS / 1000} seconds.
          </Message>
        )}

        {data && (
          <>
            {error && (
              <Message type="warn">
                Connection problem: {error} Showing the last data received at {checkedAt?.toLocaleTimeString()}. Retrying
                automatically.
              </Message>
            )}
            {data.device_status !== "online" && (
              <Message type="warn">The bus device is offline. The information shown may be out of date.</Message>
            )}
            {!data.location && (
              <Message type="warn">GPS location unavailable. No location has been received from this bus yet.</Message>
            )}

            <div className="parent-grid">
              <div className="parent-col">
                <div className="panel">
                  <div className="panel-title">Bus Information</div>
                  <table className="data info">
                    <tbody>
                      <tr><th>Bus Number</th><td>{data.bus_number}</td></tr>
                      <tr><th>Bus Name</th><td>{data.bus_name}</td></tr>
                      <tr><th>Device Status</th><td><StatusBadge status={data.device_status} /></td></tr>
                      <tr>
                        <th>Last Location Update</th>
                        <td>{data.location ? formatDateTime(data.location.updated_at) : "Unavailable"}</td>
                      </tr>
                      <tr>
                        <th>Current Speed</th>
                        <td>{data.location ? `${data.location.speed_kmph} km/h` : "Unavailable"}</td>
                      </tr>
                      <tr><th>Assigned Route</th><td>{data.route ? data.route.route_name : "No route assigned"}</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="panel">
                  <div className="panel-title">Estimated Arrival</div>
                  <div className="panel-body">
                    {selectedStopId == null && <p style={{ margin: 0 }}>Select a bus stop from the list or the map to see the estimated arrival time.</p>}
                    {selectedStopId != null && (
                      <>
                        <p style={{ marginTop: 0 }}>
                          Stop: <strong>{selectedStop ? selectedStop.stop_name : eta?.stop_name || "-"}</strong>
                        </p>
                        {etaError && <Message type="error">{etaError}</Message>}
                        {!eta && !etaError && <p>Loading ETA...</p>}
                        {eta && (
                          <>
                            {eta.eta_minutes != null ? (
                              <p>
                                Estimated arrival: <span className="eta-value">{eta.eta_minutes} min</span>
                              </p>
                            ) : (
                              <Message type="warn">{eta.message || "ETA is currently unavailable."}</Message>
                            )}
                            <p style={{ marginBottom: 0 }}>
                              Distance: {eta.distance_km != null ? <strong>{eta.distance_km} km</strong> : "Unavailable"}
                              <br />
                              <span className="muted">Straight-line distance at the bus's current speed.</span>
                            </p>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-title">Route Stops</div>
                  {stops.length === 0 ? (
                    <div className="panel-body muted">
                      {data.route ? "This route has no stops." : "No route is assigned to this bus."}
                    </div>
                  ) : (
                    <table className="data">
                      <thead><tr><th>#</th><th>Stop Name</th><th></th></tr></thead>
                      <tbody>
                        {stops.map((s) => (
                          <tr key={s.id} className={s.id === selectedStopId ? "selected" : ""}>
                            <td>{s.stop_order}</td>
                            <td>{s.stop_name}</td>
                            <td><button onClick={() => setSelectedStopId(s.id)}>Show ETA</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="parent-col map-col">
                <div className="panel">
                  <div className="panel-title">
                    <span>Live Map</span>
                    {data.location && <button onClick={() => setRecenter((n) => n + 1)}>Center on bus</button>}
                  </div>
                  {data.location || stops.length > 0 ? (
                    <TrackMap
                      busNumber={data.bus_number}
                      location={data.location}
                      stops={stops}
                      selectedStopId={selectedStopId}
                      onSelectStop={setSelectedStopId}
                      recenterTrigger={recenter}
                    />
                  ) : (
                    <div className="panel-body muted">Map unavailable: there is no GPS location and no route stops to display.</div>
                  )}
                </div>
              </div>
            </div>

            <p className="muted">
              Updates automatically every {POLL_MS / 1000} seconds.
              {checkedAt && <> Last checked: {checkedAt.toLocaleTimeString()}.</>}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
