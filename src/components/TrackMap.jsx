import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";

// Simple CSS-based markers (avoids Leaflet's default image icons, which break under bundlers).
const iconCache = {};
function busIcon() {
  if (!iconCache.bus) {
    iconCache.bus = L.divIcon({
      className: "",
      html: '<div class="bus-marker">BUS</div>',
      iconSize: [34, 20],
      iconAnchor: [17, 10],
    });
  }
  return iconCache.bus;
}
function stopIcon(order, selected) {
  const key = `stop-${order}-${selected}`;
  if (!iconCache[key]) {
    iconCache[key] = L.divIcon({
      className: "",
      html: `<div class="stop-marker${selected ? " selected" : ""}">${Number(order)}</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
  }
  return iconCache[key];
}

// Fits the map to all points once, on first render with data. Later updates do not move the view.
function FitOnce({ points }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || points.length === 0) return;
    done.current = true;
    if (points.length === 1) map.setView(points[0], 15);
    else map.fitBounds(points, { padding: [30, 30] });
  }, [points, map]);
  return null;
}

function Recenter({ position, trigger }) {
  const map = useMap();
  useEffect(() => {
    if (trigger > 0 && position) map.setView(position, Math.max(map.getZoom(), 15));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
  return null;
}

export default function TrackMap({ busNumber, location, stops, selectedStopId, onSelectStop, recenterTrigger }) {
  const busPos = location ? [location.latitude, location.longitude] : null;
  const points = [...(busPos ? [busPos] : []), ...stops.map((s) => [s.latitude, s.longitude])];

  if (points.length === 0) return null;

  return (
    <div className="map-box">
      <MapContainer center={points[0]} zoom={14} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitOnce points={points} />
        <Recenter position={busPos} trigger={recenterTrigger} />

        {stops.map((s) => (
          <Marker
            key={s.id}
            position={[s.latitude, s.longitude]}
            icon={stopIcon(s.stop_order, s.id === selectedStopId)}
            eventHandlers={{ click: () => onSelectStop(s.id) }}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              {s.stop_order}. {s.stop_name}
            </Tooltip>
          </Marker>
        ))}

        {busPos && (
          <Marker position={busPos} icon={busIcon()} zIndexOffset={1000}>
            <Popup>
              Bus {busNumber}
              <br />
              Speed: {location.speed_kmph} km/h
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
