import { ArrowLeft, LogOut } from "lucide-react";

export default function Topbar({ role, onLogout, onBoardSwitch }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Portal</p>
        <h1>{role}</h1>
      </div>
      <div className="topbar-actions">
        {onBoardSwitch && (
          <button className="secondary-btn switch-board-btn" onClick={onBoardSwitch}>
            <ArrowLeft size={17} />
            Switch Board
          </button>
        )}
        <button className="secondary-btn logout-btn" onClick={onLogout}>
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </header>
  );
}
