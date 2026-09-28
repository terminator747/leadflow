import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState("login");
  const [accountType, setAccountType] = useState("advisor");
  const [name, setName] = useState("");
  const [brokerageName, setBrokerageName] = useState("");
  const [brokerageCode, setBrokerageCode] = useState("");
  const [email, setEmail] = useState("admin@leadflow.test");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(next) {
    setMode(next);
    setError("");
    setSuccess("");
    if (next === "register") {
      setEmail("");
      setPassword("");
      setName("");
      setBrokerageName("");
      setBrokerageCode("");
    } else {
      setEmail("admin@leadflow.test");
      setPassword("Password123!");
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to sign in. Check the server and credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
        accountType,
        brokerageName: accountType === "brokerage_admin" ? brokerageName : undefined,
        brokerageCode: accountType === "advisor" ? brokerageCode : undefined
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      window.location.href = "/dashboard";
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to create the account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page-modern">
      <section className="login-visual">
        <div className="visual-noise" />
        <div className="visual-orb orb-a" />
        <div className="visual-orb orb-b" />
        <div className="visual-grid" />

        <div className="visual-brand">
          <div className="brand-mark large">L</div>
          <span>LeadFlow</span>
        </div>

        <div className="visual-content">
          <span className="visual-kicker"><Sparkles size={14} /> INTELLIGENT MORTGAGE CRM</span>
          <h1>Turn every lead into a clearer next step.</h1>
          <p>One calm workspace for leads, advisors, clients and documents.</p>

          <div className="mini-dashboard">
            <div className="mini-window-top">
              <span><i /> Live pipeline</span>
              <span className="mini-status">● synced</span>
            </div>
            <div className="mini-metrics">
              <div><span>Active leads</span><strong>128</strong><small>+12.4%</small></div>
              <div><span>Qualified</span><strong>42</strong><small>+8.2%</small></div>
              <div><span>Won</span><strong>18</strong><small>+16.1%</small></div>
            </div>
            <div className="mini-chart">
              {[36, 54, 43, 70, 61, 84, 73, 94].map((height, index) => (
                <span key={index} style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
        </div>

        <div className="login-person">
          <img src="/leadflow-person.svg" alt="LeadFlow advisor working at a laptop" />
          <div className="floating-ui one"><strong>42</strong><span>Qualified leads</span></div>
          <div className="floating-ui two"><strong>● Live</strong><span>Pipeline synced</span></div>
        </div>

        <div className="visual-footer">
          <span>SECURE WORKSPACE</span>
          <span><ShieldCheck size={14} /> Role-based access</span>
          <span><CheckCircle2 size={14} /> Real-time updates</span>
        </div>
      </section>

      <section className="login-panel-modern">
        <div className="login-card-modern">
          <div className="mobile-login-brand">
            <div className="brand-mark">L</div>
            <strong>LeadFlow</strong>
          </div>

          <div className="auth-switch">
            <button className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>Sign in</button>
            <button className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")}>Create account</button>
          </div>

          {mode === "login" ? (
            <>
              <span className="eyebrow">WELCOME BACK</span>
              <h2>Sign in to your workspace</h2>
              <p className="login-subtitle">Manage your mortgage pipeline from one intelligent workspace.</p>

              <form onSubmit={handleLogin} className="form-stack">
                <label>
                  Email address
                  <div className="input-wrap modern-input">
                    <Mail size={17} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
                  </div>
                </label>

                <label>
                  Password
                  <div className="input-wrap modern-input">
                    <LockKeyhole size={17} />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
                  </div>
                </label>

                {error && <div className="alert error">{error}</div>}

                <button className="primary-button login-submit" disabled={loading}>
                  {loading ? "Signing in..." : "Continue to LeadFlow"}
                  <ArrowRight size={17} />
                </button>
              </form>

              <div className="demo-credentials modern-demo">
                <div className="demo-title"><span>DEMO ACCESS</span><span>Ready to explore</span></div>
                <div className="demo-row"><strong>Email</strong><span>admin@leadflow.test</span></div>
                <div className="demo-row"><strong>Password</strong><span>Password123!</span></div>
              </div>
            </>
          ) : (
            <>
              <span className="eyebrow">JOIN LEADFLOW</span>
              <h2>Create your account</h2>
              <p className="login-subtitle">Create a separate workspace identity for your role.</p>

              <div className="register-type">
                <button type="button" className={accountType === "advisor" ? "active" : ""} onClick={() => setAccountType("advisor")}>
                  <UserRound size={17} />
                  <strong>Advisor</strong>
                  <span>Join an existing brokerage</span>
                </button>
                <button type="button" className={accountType === "brokerage_admin" ? "active" : ""} onClick={() => setAccountType("brokerage_admin")}>
                  <ShieldCheck size={17} />
                  <strong>Brokerage admin</strong>
                  <span>Create a new brokerage</span>
                </button>
              </div>

              <form onSubmit={handleRegister} className="form-stack">
                <label>
                  Full name
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
                </label>

                <label>
                  Email address
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
                </label>

                <label>
                  Password
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required />
                </label>

                {accountType === "advisor" ? (
                  <>
                    <label>
                      Brokerage invite code
                      <input value={brokerageCode} onChange={(e) => setBrokerageCode(e.target.value.toUpperCase())} placeholder="LF-ABC123" required />
                    </label>
                    <p className="invite-note">Ask your brokerage admin for the LeadFlow invite code.</p>
                  </>
                ) : (
                  <label>
                    Brokerage name
                    <input value={brokerageName} onChange={(e) => setBrokerageName(e.target.value)} placeholder="Your brokerage" required />
                  </label>
                )}

                {error && <div className="alert error">{error}</div>}
                {success && <div className="alert">{success}</div>}

                <button className="primary-button login-submit" disabled={loading}>
                  {loading ? "Creating account..." : "Create account"}
                  <ArrowRight size={17} />
                </button>
              </form>
            </>
          )}

          <p className="login-footnote">LeadFlow CRM · Secure role-based workspace</p>
        </div>
      </section>
    </div>
  );
}
