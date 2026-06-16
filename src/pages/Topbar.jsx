import { LogOut } from "lucide-react";

export default function Topbar({ role, onLogout }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Portal</p>
        <h1>{role}</h1>
      </div>
      <button className="secondary-btn logout-btn" onClick={onLogout}>
        <LogOut size={17} />
        Logout
      </button>
    </header>
  );
}
