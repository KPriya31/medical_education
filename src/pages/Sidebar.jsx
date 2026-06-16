import { Activity } from "lucide-react";
import { groupByField } from "../utils.js";

export default function Sidebar({ routes, activeRoute, setActiveRoute }) {
  const groupedRoutes = groupByField(routes, "group");
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Activity size={22} />
        </div>
        <div>
          <strong>EMS</strong>
          <span>Medical Education Board</span>
        </div>
      </div>
      <nav className="nav-list" aria-label="Role modules">
        {Object.entries(groupedRoutes).map(([group, groupRoutes]) => (
          <div className="nav-group" key={group}>
            <p>{group}</p>
            {groupRoutes.map((route) => {
              const Icon = route.icon;
              return (
                <button
                  key={route.key}
                  className={route.key === activeRoute ? "nav-item active" : "nav-item"}
                  onClick={() => setActiveRoute(route.key)}
                >
                  <Icon size={18} />
                  <span>{route.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
