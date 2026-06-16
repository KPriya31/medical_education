import { useState } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import DepartmentSelectPage from "./pages/DepartmentSelectPage.jsx";
import AppShell from "./pages/AppShell.jsx";
import { SEED_DATA } from "./data.js";

export default function App() {
  const [session, setSession] = useState({ screen: "login", role: null, loginType: null });
  const [activeRoute, setActiveRoute] = useState("dashboard");
  const [data, setData] = useState(SEED_DATA);

  function handleLogin(loginType) {
    if (loginType === "super-admin") {
      setSession({ screen: "app", role: "Super Admin", loginType });
      setActiveRoute("dashboard");
      return;
    }
    setSession({ screen: "department-select", role: null, loginType });
  }

  function handleDepartmentSelect(board) {
    setSession({ screen: "app", role: board, loginType: "department" });
    setActiveRoute("dashboard");
  }

  function handleLogout() {
    setSession({ screen: "login", role: null, loginType: null });
    setActiveRoute("dashboard");
  }

  function updateEntity(entity, rows) {
    setData((prev) => ({ ...prev, [entity]: rows }));
  }

  if (session.screen === "login") {
    return <LoginPage onLogin={handleLogin} />;
  }
  if (session.screen === "department-select") {
    return <DepartmentSelectPage onBack={handleLogout} onSelect={handleDepartmentSelect} />;
  }
  return (
    <AppShell
      role={session.role}
      data={data}
      activeRoute={activeRoute}
      setActiveRoute={setActiveRoute}
      updateEntity={updateEntity}
      onLogout={handleLogout}
    />
  );
}
