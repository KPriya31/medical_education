import { useMemo } from "react";
import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import Dashboard from "./Dashboard.jsx";
import CrudPage from "./CrudPage.jsx";
import DepartmentAdminsPage from "./DepartmentAdminsPage.jsx";
import { ROUTES } from "../routes.js";
import { ENTITY_COLUMNS } from "../data.js";

export default function AppShell({
  role,
  data,
  activeRoute,
  setActiveRoute,
  updateEntity,
  onLogout,
  onBoardSwitch,
}) {
  const routesForRole = useMemo(() => ROUTES.filter((route) => route.roles.includes(role)), [role]);
  const currentRoute = routesForRole.find((route) => route.key === activeRoute) || routesForRole[0];

  return (
    <div className="page-with-header">
      <SiteHeader />
      <div className="app-shell">
        <Sidebar routes={routesForRole} activeRoute={currentRoute.key} setActiveRoute={setActiveRoute} />
        <main className="main-panel">
          <Topbar role={role} onLogout={onLogout} onBoardSwitch={onBoardSwitch} />
          {currentRoute.type === "dashboard" ? (
            <Dashboard data={data} role={role} routes={routesForRole} setActiveRoute={setActiveRoute} updateEntity={updateEntity} />
          ) : currentRoute.type === "department-admins" ? (
            <DepartmentAdminsPage />
          ) : (
            <CrudPage
              route={currentRoute}
              rows={data[currentRoute.entity] || []}
              columns={ENTITY_COLUMNS[currentRoute.entity] || []}
              onChange={(rows) => updateEntity(currentRoute.entity, rows)}
              role={role}
            />
          )}
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
