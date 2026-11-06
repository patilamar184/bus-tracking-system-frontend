export function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

// The backend returns a relative URL such as "/track/<token>". QR codes need a full address.
export function publicUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const base = (import.meta.env.VITE_PUBLIC_URL || window.location.origin).replace(/\/+$/, "");
  return base + path;
}

export const sortStops = (stops) => [...stops].sort((a, b) => a.stop_order - b.stop_order);
