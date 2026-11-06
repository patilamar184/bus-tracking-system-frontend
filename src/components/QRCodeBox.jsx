import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

// Renders a real QR code for `url` and lets the user download it as a PNG.
export default function QRCodeBox({ url, filename, size = 160 }) {
  const wrapRef = useRef(null);

  function download() {
    const canvas = wrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${filename}.png`;
    link.click();
  }

  return (
    <div className="qr-box" ref={wrapRef}>
      <QRCodeCanvas value={url} size={size} level="M" marginSize={2} />
      <button onClick={download}>Download QR</button>
    </div>
  );
}
