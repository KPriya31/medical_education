// Small icon-only button used for row actions (View/Edit/Delete/etc).
export default function IconButton({ label, onClick, icon: Icon, tone }) {
  return (
    <button
      className={`icon-btn ${tone || ""}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <Icon size={16} />
    </button>
  );
}
