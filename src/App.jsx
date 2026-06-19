import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import DepartmentSelectPage from "./pages/DepartmentSelectPage.jsx";
import AppShell from "./pages/AppShell.jsx";
import { SEED_DATA } from "./data.js";

const DEFAULT_SESSION = { screen: "login", role: null, loginType: null };
const SESSION_STORAGE_KEY = "ems-session";
const ACTIVE_ROUTE_STORAGE_KEY = "ems-active-route";

function readStoredSession() {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return DEFAULT_SESSION;
    const parsed = JSON.parse(stored);
    if (!["login", "department-select", "app"].includes(parsed?.screen)) return DEFAULT_SESSION;
    if (parsed.screen === "app" && !parsed.role) return DEFAULT_SESSION;
    return {
      screen: parsed.screen,
      role: parsed.role || null,
      loginType: parsed.loginType || null,
    };
  } catch {
    return DEFAULT_SESSION;
  }
}

function readStoredActiveRoute() {
  try {
    return sessionStorage.getItem(ACTIVE_ROUTE_STORAGE_KEY) || "dashboard";
  } catch {
    return "dashboard";
  }
}

export default function App() {
  const [session, setSession] = useState(readStoredSession);
  const [activeRoute, setActiveRoute] = useState(readStoredActiveRoute);
  const [data, setData] = useState(SEED_DATA);

  useEffect(() => {
    if (session.screen === "login") {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem(ACTIVE_ROUTE_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    if (session.screen === "app") {
      sessionStorage.setItem(ACTIVE_ROUTE_STORAGE_KEY, activeRoute);
    }
  }, [activeRoute, session.screen]);

  // Super Admin is a hardcoded demo login. Department logins are real accounts
  // (created by Super Admin) - after authenticating they still pick BOME or BOEN.
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

  function handleBoardSwitch() {
    sessionStorage.removeItem(ACTIVE_ROUTE_STORAGE_KEY);
    setSession({ screen: "department-select", role: null, loginType: "department" });
    setActiveRoute("dashboard");
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(ACTIVE_ROUTE_STORAGE_KEY);
    setSession(DEFAULT_SESSION);
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
      onBoardSwitch={session.loginType === "department" ? handleBoardSwitch : null}
    />
  );
}
