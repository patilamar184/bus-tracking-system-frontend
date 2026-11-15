# School Bus Tracking System – Frontend

React-based web application for the IoT-Based School Bus Tracking and Management System.

The frontend provides an administrator dashboard for managing buses, routes and stops, and a public parent tracking page with a live map, bus location and estimated arrival information.

## Related Repositories

This frontend requires the backend:

- [Backend – FastAPI](https://github.com/patilamar184/bus-tracking-system-backend)

The hardware communication component is:

- [HTTP Relay – SIM800L Communication](https://github.com/patilamar184/bus-tracking-http-relay)

## Technology Stack

- React 18
- Vite
- JavaScript
- React Router
- Axios
- Leaflet
- React-Leaflet
- OpenStreetMap
- qrcode.react
- CSS

## 1. Prerequisites

Install:

- Git
- Node.js (LTS version recommended)
- npm (included with Node.js)

Verify installation:

```bash
git --version
node --version
npm --version
```

## 2. Clone the Repository

```bash
git clone https://github.com/patilamar184/bus-tracking-system-frontend.git

cd bus-tracking-system-frontend
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Configure Environment Variables

Create a local `.env` file from the supplied template.

**Windows CMD:**

```cmd
copy .env.example .env
```

**PowerShell:**

```powershell
Copy-Item .env.example .env
```

Open `.env` and configure:

```env
VITE_API_URL=http://localhost:8000
VITE_PUBLIC_URL=
```

### Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the FastAPI backend |
| `VITE_PUBLIC_URL` | Optional public website URL used in generated QR codes |

### Local Development

If the backend is running locally:

```env
VITE_API_URL=http://localhost:8000
```

### Using the Cloudflare Backend URL

If the backend is exposed through Cloudflare Quick Tunnel:

```env
VITE_API_URL=https://YOUR-CLOUDFLARE-URL.trycloudflare.com
```

Replace the example with your actual Cloudflare URL.

`VITE_PUBLIC_URL` can remain empty during local development. In that case, the application uses the address from which the website is being accessed.

**Important:** Restart the Vite development server after changing `.env`.

## 5. Start the Backend First

Clone and configure the backend repository:

https://github.com/patilamar184/bus-tracking-system-backend

Start the backend:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend should be accessible at:

```text
http://localhost:8000
```

Swagger documentation:

```text
http://localhost:8000/docs
```

Ensure the backend's `CORS_ORIGINS` environment variable includes:

```env
CORS_ORIGINS=http://localhost:5173
```

If you open the frontend using another origin, add that origin too.

## 6. Start the Frontend

Run:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

The frontend will communicate with the backend using `VITE_API_URL`.

## 7. Application Pages

| Route | Purpose |
|---|---|
| `/admin/login` | Administrator login |
| `/admin` | Dashboard with bus and route statistics |
| `/admin/buses` | Add, view, edit and delete buses |
| `/admin/routes` | Create and manage routes and stops |
| `/admin/qr-codes` | View and download bus QR codes |
| `/track/:token` | Public parent tracking page |

## 8. Admin Setup

1. Open `/admin/login`.
2. Log in using the administrator credentials configured in the backend `.env`.
3. Create a route and add its stops.
4. Create a bus.
5. Assign the bus to a route.
6. Save the device API key displayed after bus creation.
7. Configure the ESP32 firmware with the corresponding device ID and API key.

**Important:** The device API key is displayed only once when the bus is created. Save it securely.

## 9. ESP32 Hardware Integration

The ESP32 device uses:

- ESP32 DevKit V1
- SIM800L GSM/GPRS module
- NEO-6M GPS module

The ESP32 sends:

- Heartbeat data
- GPS location data

The backend endpoints are:

```text
POST /api/device/heartbeat
POST /api/device/location
```

The device communicates through the HTTP Relay repository:

https://github.com/patilamar184/bus-tracking-http-relay

## 10. Parent Tracking

Parents can scan the QR code generated for a bus.

The QR code opens the public tracking route:

```text
/track/<public_token>
```

The parent tracking page displays:

- Bus information
- Live bus position on OpenStreetMap
- Route stops
- Estimated arrival time
- Location update information

No parent login is required.

For QR codes intended for use outside your local network, configure `VITE_PUBLIC_URL` with the publicly accessible frontend website URL before generating and printing them.

## 11. Production Build

Create a production build:

```bash
npm run build
```

The generated files will be available in:

```text
dist/
```

Set `VITE_API_URL` to the public backend URL before building.

The hosting server must serve `index.html` for unknown application routes so direct access to `/track/<token>` works correctly.

## 12. Troubleshooting

**Frontend cannot connect to backend**
- Check that FastAPI is running.
- Verify `VITE_API_URL`.
- Check backend CORS configuration.
- Restart Vite after modifying `.env`.

**Admin login fails**
- Check the backend administrator credentials.
- Confirm the backend is connected to the expected database.

**Parent tracking page does not show a bus**
- Verify the public tracking token.
- Check that the ESP32 is sending valid GPS data.
- Confirm that the backend has received the latest location.

## Repository Links

- Backend: https://github.com/patilamar184/bus-tracking-system-backend
- Frontend: https://github.com/patilamar184/bus-tracking-system-frontend
- HTTP Relay: https://github.com/patilamar184/bus-tracking-http-relay
