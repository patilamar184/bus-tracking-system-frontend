# School Bus Tracking – React Frontend

Admin panel and parent tracking page for the FastAPI backend in `../backend`.
**Stack:** React 18, Vite, JavaScript, React Router, Axios, Leaflet + React-Leaflet (OpenStreetMap), plain CSS.
`qrcode.react` is the QR code library (the spec requires one on the frontend).

All data comes from the backend. There is no demo data, mock API or simulated movement.

## Setup

```bash
cd frontend
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run dev                 # http://localhost:5173
```

Start the backend first (`uvicorn app.main:app --reload` in `backend/`). Its `CORS_ORIGINS` must include the address you open the frontend from (default `http://localhost:5173`).

### `.env`

| Variable | Meaning |
|---|---|
| `VITE_API_URL` | Backend base URL, e.g. `http://localhost:8000`. Every API call uses this. |
| `VITE_PUBLIC_URL` | *Optional.* Address of this website to encode in QR codes. Empty = the address you are browsing from. **Set it before printing QR codes**, otherwise they contain `localhost`, which parents' phones cannot open. Example: `https://yourwebsite.com`. |

Restart `npm run dev` after changing `.env`.

## Pages

| URL | Who | What |
|---|---|---|
| `/admin/login` | Admin | Login (JWT stored in `localStorage`; expired/invalid tokens redirect back here) |
| `/admin` | Admin | Dashboard: total/online/offline buses, total routes (auto-refreshes every 10 s) |
| `/admin/buses` | Admin | Add / view / edit / delete buses, device status, last heartbeat, route, latest GPS, QR code |
| `/admin/routes` | Admin | Create / edit / delete routes with ordered stops |
| `/admin/qr-codes` | Admin | QR code, public URL and download button for every bus |
| `/track/:token` | Parent | No login. Bus info, live OpenStreetMap map, stops, ETA; polls every 5 s |

## Backend contract notes

The frontend follows the backend exactly. Things to be aware of:

- **Device API key.** The create-bus response includes `device_api_key`, shown **once**. The Bus Management page displays it right after registration; copy it into the ESP32 firmware. It cannot be retrieved later.
- **Route on a new bus.** `POST /api/admin/buses` has no route field, so choosing a route while adding a bus triggers a second call, `PUT /api/admin/buses/{id}`.
- **Device ID is read-only** when editing (the backend rejects changes to it).
- **Latest GPS location** is not in the bus list response, so it appears in the "View" details (`GET /api/admin/buses/{id}`).
- **Parent response has no heartbeat time**, so the parent page shows "Last Location Update" (`location.updated_at`) instead.
- **Stop IDs change** whenever a route is saved, because the backend replaces the stops list. A parent who has a stop selected may briefly see an error until they select it again.
- The ETA is `null` with a message when the bus has no location, is offline, or has speed 0; the page shows that message instead of a number.

## Deploying

`npm run build` creates `dist/`. Host it with a rule that serves `index.html` for unknown paths (otherwise opening `/track/<token>` directly gives a 404). Set `VITE_API_URL` to the public backend URL **before** building, and add the site's address to the backend's `CORS_ORIGINS`.

## Manual test checklist

Run these against the real backend (nothing here was run by the author; see below):

1. Log in with the admin credentials from the backend `.env`; wrong password shows an error.
2. Routes → create a route with two stops; edit it; stops show in order.
3. Buses → add a bus with a route; copy the device key; the bus appears as Offline.
4. Send `POST /api/device/heartbeat` and `/api/device/location` (Swagger UI or the ESP32) → Dashboard shows 1 online; bus "View" shows GPS.
5. Bus QR code downloads as PNG; scanning it (or opening the URL) opens `/track/<token>`.
6. Parent page shows the bus marker at the posted coordinates; post a new location and it moves within ~5 s.
7. Select a stop → ETA and distance; post speed 0 → "ETA unavailable" message.
8. Open `/track/bogus` → "tracking link is not valid".
9. Stop the backend → parent page shows a connection warning and keeps the last real data, labelled with its time.
10. Delete a route → its buses show no route. Delete a bus → it disappears.
