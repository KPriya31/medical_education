import { Building2 } from "lucide-react";
import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import { BOARD_ROLES } from "../data.js";

export default function DepartmentSelectPage({ onBack, onSelect }) {
  return (
    <div className="page-with-header">
      <SiteHeader showSearch={false} />
      <main className="department-screen">
        <section className="department-card">
          <div className="department-heading">
            <div className="seal-mark small">
              <Building2 size={26} />
            </div>
            <div>
              <p className="eyebrow">Department Portal</p>
              <h1>Select Board</h1>
            </div>
          </div>
          <div className="department-options">
            {BOARD_ROLES.map((board) => (
              <button key={board} className="board-option" onClick={() => onSelect(board)}>
                <span>{board}</span>
                <strong>{board === "BOME" ? "Medical Education" : "Examination in Nursing"}</strong>
              </button>
            ))}
          </div>
          <button className="secondary-btn" onClick={onBack}>
            Back to Login
          </button>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
