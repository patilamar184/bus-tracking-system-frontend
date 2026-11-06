// type: "error" | "success" | "warn" | "info"
export default function Message({ type = "info", children, onClose }) {
  return (
    <div className={`msg ${type}`}>
      {children}
      {onClose && (
        <button style={{ float: "right" }} onClick={onClose}>
          Close
        </button>
      )}
    </div>
  );
}
