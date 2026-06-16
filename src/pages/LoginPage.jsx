import { useState } from "react";
import { RefreshCw, LockKeyhole, ShieldCheck, Layers, UserCheck } from "lucide-react";
import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import { LOGIN_CREDENTIALS } from "../data.js";
import { randomCaptcha } from "../utils.js";

export default function LoginPage({ onLogin }) {
  const [loginType, setLoginType] = useState("super-admin");
  const [form, setForm] = useState({ username: "", password: "", captcha: "" });
  const [captcha, setCaptcha] = useState(randomCaptcha());
  const [error, setError] = useState("");
  const credentials = LOGIN_CREDENTIALS[loginType];

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  function refreshCaptcha(clearError = true) {
    setCaptcha(randomCaptcha());
    setForm((prev) => ({ ...prev, captcha: "" }));
    if (clearError) setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setError("Enter username and password.");
      return;
    }
    if (form.username.trim() !== credentials.username || form.password !== credentials.password) {
      setError("Invalid demo credentials.");
      return;
    }
    if (form.captcha.trim().toUpperCase() !== captcha) {
      refreshCaptcha(false);
      setError("Captcha does not match.");
      return;
    }
    onLogin(loginType);
  }

  return (
    <div className="page-with-header portal-page">
      <SiteHeader showSearch={false} />
      <main className="login-page">
        <div className="login-layout">
          <section className="login-card">
            <div className="login-card-heading">
              <p className="eyebrow">Secure Login</p>
              <h2>EMS Login</h2>
              <span>{loginType === "super-admin" ? "Super Admin access" : "Department access"}</span>
            </div>
            <div className="login-tabs" role="tablist" aria-label="Login role">
              <button
                type="button"
                className={loginType === "super-admin" ? "active" : ""}
                onClick={() => setLoginType("super-admin")}
              >
                Super Admin
              </button>
              <button
                type="button"
                className={loginType === "department" ? "active" : ""}
                onClick={() => setLoginType("department")}
              >
                Department
              </button>
            </div>
            <form className="login-form" onSubmit={handleSubmit}>
              <label>
                <span>Username</span>
                <input
                  value={form.username}
                  onChange={(e) => setField("username", e.target.value)}
                  placeholder={credentials.username}
                />
              </label>
              <label>
                <span>Password</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder="Password"
                />
              </label>
              <div className="captcha-block">
                <span>Captcha Verification</span>
                <div className="captcha-row">
                  <div className="captcha-code" aria-label="Captcha code">
                    {captcha}
                  </div>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => refreshCaptcha()}
                    aria-label="Refresh captcha"
                    title="Refresh captcha"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
              <label>
                <span>Enter Captcha</span>
                <input
                  value={form.captcha}
                  onChange={(e) => setField("captcha", e.target.value)}
                  placeholder="Enter captcha"
                />
              </label>
              {error && <div className="login-error">{error}</div>}
              <button className="primary-btn login-submit" type="submit">
                <LockKeyhole size={18} />
                Login
              </button>
            </form>
            <DemoCredentialsHint activeType={loginType} />
          </section>
          <LoginInfoPanel />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

// Hint panel under the login form showing the demo username/password for each login type.
function DemoCredentialsHint({ activeType }) {
  return (
    <div className="demo-credentials" aria-label="Demo credentials">
      {Object.entries(LOGIN_CREDENTIALS).map(([key, credentials]) => (
        <div className={key === activeType ? "demo-card active" : "demo-card"} key={key}>
          <span>{credentials.label}</span>
          <code>{credentials.username}</code>
          <code>{credentials.password}</code>
        </div>
      ))}
    </div>
  );
}

// Info aside on the login page describing the system at a glance.
function LoginInfoPanel() {
  const items = [
    { icon: ShieldCheck, label: "Secure EMS Portal" },
    { icon: Layers, label: "Student, Examination, Marks, MIS" },
    { icon: UserCheck, label: "Role-based access" },
    { icon: LockKeyhole, label: "OTP / Captcha protected login" },
  ];
  return (
    <aside className="login-info-panel" aria-label="EMS system information">
      <div className="info-panel-heading">
        <p className="eyebrow">Internal System</p>
        <h2>EMS Access</h2>
      </div>
      <div className="info-chip-grid">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div className="info-chip" key={item.label}>
              <Icon size={18} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
