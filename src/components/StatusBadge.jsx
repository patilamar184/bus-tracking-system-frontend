export default function StatusBadge({ status }) {
  const online = status === "online";
  return <span className={online ? "status-online" : "status-offline"}>{online ? "Online" : "Offline"}</span>;
}
