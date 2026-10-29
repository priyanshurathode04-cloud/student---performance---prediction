"use client";

/* eslint-disable react-hooks/set-state-in-effect -- initial state is synchronized with the external Supabase session and history. */

import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../lib/supabase";
import Sidebar from "../components/Sidebar";
import {
  Activity, BrainCircuit, CalendarDays, ChartNoAxesCombined,
  CircleHelp, Clock3, GraduationCap, Lightbulb,
  ShieldCheck, Sparkles, Target, LoaderCircle, AlertCircle, CheckCircle2,
} from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://student-performance-prediction-51f4.onrender.com").replace(/\/$/, "");


const fields = [
  { key: "study_hours_per_day", label: "Study hours per day", min: 0, max: 24, step: 0.5, initial: 2.5, hint: "Time spent studying on a typical day." },
  { key: "attendance_percent", label: "Attendance", min: 0, max: 100, step: 1, initial: 85, hint: "Percentage of classes attended." },
  { key: "assignment_completion_percent", label: "Assignment completion", min: 0, max: 100, step: 1, initial: 80, hint: "Percentage of assignments completed." },
  { key: "practice_quizzes_per_week", label: "Practice quizzes per week", min: 0, max: 100, step: 1, initial: 3, hint: "Number of practice quizzes in a week." },
  { key: "class_participation_score", label: "Class participation (0–10)", min: 0, max: 10, step: 1, initial: 6, hint: "Self-assessed participation on a 0–10 scale." },
  { key: "previous_score", label: "Previous score", min: 0, max: 100, step: 1, initial: 70, hint: "Your previous score out of 100." },
  { key: "sleep_hours", label: "Sleep hours per day", min: 0, max: 24, step: 0.5, initial: 7.5, hint: "Average sleep in a day." },
] as const;

type FeatureKey = typeof fields[number]["key"];
type Features = Record<FeatureKey, number>;
type Prediction = {
  status: string;
  message: string;
  predicted_score: number;
  model_name: string;
  dataset: string;
  guidance: string[];
  disclaimer: string;
};

const initialFeatures = Object.fromEntries(fields.map((field) => [field.key, field.initial])) as Features;

function MetricCard({ icon: Icon, label, value, unit, note, accent = "blue" }: {
  icon: typeof Activity; label: string; value: string; unit?: string; note: string; accent?: "blue" | "green";
}) {
  return (
    <section className="panel metric-card">
      <div className="metric-heading">
        <span>{label}</span>
        <span className="metric-icon" style={accent === "green" ? { color: "var(--green)", background: "var(--green-soft)" } : undefined}><Icon size={16} /></span>
      </div>
      <div className="metric-value">{value}{unit && <span className="unit"> {unit}</span>}</div>
      <div className="metric-foot">{note}</div>
    </section>
  );
}

function ScoreChart() {
  const actual = "44,142 124,119 204,130 284,93 364,103 444,71 524,82 604,46";
  const predicted = "44,134 124,112 204,101 284,87 364,78 444,64 524,47 604,31";
  const points = [44, 124, 204, 284, 364, 444, 524, 604];
  return (
    <div className="chart-wrap">
      <svg className="chart-svg" viewBox="0 0 650 235" role="img" aria-label="Illustrative score trend chart, demo data only">
        {[35, 75, 115, 155, 195].map((y, i) => (
          <g key={y}>
            <line x1="42" y1={y} x2="620" y2={y} className="chart-grid" />
            <text x="29" y={y + 4} textAnchor="end" className="chart-label">{100 - i * 20}</text>
          </g>
        ))}
        {points.map((x, i) => (
          <g key={x}>
            <line x1={x} y1="35" x2={x} y2="195" className="chart-grid" opacity=".5" />
            <text x={x} y="218" textAnchor="middle" className="chart-label">W{i + 1}</text>
          </g>
        ))}
        <polyline points={actual} className="chart-line-blue" />
        <polyline points={predicted} className="chart-line-green" />
        {actual.split(" ").map((point) => {
          const [cx, cy] = point.split(",").map(Number);
          return <circle key={point} cx={cx} cy={cy} r="3.5" className="chart-point-blue" />;
        })}
        {predicted.split(" ").map((point) => {
          const [cx, cy] = point.split(",").map(Number);
          return <circle key={point} cx={cx} cy={cy} r="3.5" className="chart-point-green" />;
        })}
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  const [features, setFeatures] = useState<Features>(initialFeatures);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [studentIdInput, setStudentIdInput] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [savedCount, setSavedCount] = useState(0);
  const [history, setHistory] = useState<Array<{ id: string; predicted_score: number; created_at: string }>>([]);
  const [activeNav, setActiveNav] = useState("Overview");
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (!supabase) { setAuthReady(true); return; }
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) { setSession(data.session); setAuthReady(true); }
    }).catch(() => { if (alive) setAuthReady(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession); setAuthReady(true);
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !session?.user) { setHistory([]); return; }
    let alive = true;
    supabase.from("predictions").select("id,predicted_score,created_at")
      .order("created_at", { ascending: false }).limit(5)
      .then(({ data }) => { if (alive && data) setHistory(data); });
    return () => { alive = false; };
  }, [supabase, session?.user.id, session?.user, savedCount]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError(""); setAuthNotice("");
    if (!supabase) { setAuthError("Supabase is not configured yet. Add the frontend environment variables described below."); return; }
    const normalizedId = studentIdInput.trim().toUpperCase();
    if (authMode === "signin" && !/^STU-[A-F0-9]{12}$/.test(normalizedId)) {
      setAuthError("Enter your Student ID in the format STU- followed by 12 hexadecimal characters."); return;
    }
    if (password.length < 8) { setAuthError("Use a password with at least 8 characters."); return; }
    setAuthLoading(true);
    try {
      if (authMode === "signup") {
        const randomBytes = new Uint8Array(6);
        crypto.getRandomValues(randomBytes);
        const generatedId = "STU-" + Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
        const generatedEmail = generatedId.toLowerCase() + "@students.example.com";
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: generatedEmail, password,
          options: { data: { student_id: generatedId, full_name: fullName.trim() || "Student" } },
        });
        if (signUpError) throw signUpError;
        setStudentIdInput(generatedId);
        if (data.session) {
          setSession(data.session);
          setAuthNotice("Account created. Save your Student ID for future sign-in: " + generatedId);
        } else {
          setAuthNotice("Account created. Your Student ID is " + generatedId + ". If confirmation is enabled, this prototype cannot receive confirmation email; configure email confirmation in Supabase for testing.");
        }
      } else {
        const email = normalizedId.toLowerCase() + "@students.example.com";
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        setSession(data.session);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed. Please try again.");
    } finally { setAuthLoading(false); }
  }

  async function handleSignOut() {
    if (supabase) await supabase.auth.signOut();
    setSession(null); setPrediction(null); setHistory([]);
  }

  async function handlePredict(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setPrediction(null);
    try {
      const response = await fetch(`${API_URL}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail || `Prediction request failed (HTTP ${response.status}).`);
      }
      const result = (await response.json()) as Prediction;
      setPrediction(result);
      if (supabase && session?.user) {
        const { error: saveError } = await supabase.from("predictions").insert({
          user_id: session.user.id, features, predicted_score: result.predicted_score,
          model_name: result.model_name, dataset: result.dataset, guidance: result.guidance,
        });
        if (saveError) setError("Prediction succeeded, but saving it to your profile failed: " + saveError.message);
        else setSavedCount((count) => count + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect to the prediction API.");
    } finally {
      setLoading(false);
    }
  }

  if (!authReady) {
    return <main className="auth-screen"><section className="auth-card"><div className="brand-mark"><GraduationCap size={22} /></div><h1>StudyInsight</h1><p>Checking your student session…</p></section></main>;
  }

  if (!session && supabase && !demoMode) {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <div className="brand-mark auth-mark"><GraduationCap size={24} /></div>
          <div className="eyebrow">Student workspace</div>
          <h1>{authMode === "signin" ? "Welcome back" : "Create your student account"}</h1>
          <p className="auth-description">{authMode === "signin" ? "Sign in with your unique Student ID and password." : "Create a private account. We will generate your unique Student ID."}</p>
          {!supabase && <div className="api-message api-error" role="alert"><AlertCircle size={18} /><div><strong>Supabase setup required</strong><p>Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to the frontend environment. No credentials are hardcoded in this app.</p></div></div>}
          <form className="auth-form" onSubmit={handleAuth}>
            {authMode === "signup" && <label className="prediction-field"><span>Full name (optional)</span><input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" maxLength={100} placeholder="Your name" /></label>}
            {authMode === "signin" && <label className="prediction-field"><span>Student ID</span><input value={studentIdInput} onChange={(event) => setStudentIdInput(event.target.value.toUpperCase())} autoComplete="username" placeholder="STU-1A2B3C4D5E6F" required /></label>}
            <label className="prediction-field"><span>Password (minimum 8 characters)</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={authMode === "signin" ? "current-password" : "new-password"} minLength={8} required placeholder="Enter your password" /></label>
            {authError && <div className="api-message api-error" role="alert"><AlertCircle size={18} /><p>{authError}</p></div>}
            {authNotice && <div className="api-message" role="status"><CheckCircle2 size={18} /><p>{authNotice}</p></div>}
            <button className="predict-button auth-submit" type="submit" disabled={authLoading || !supabase}>{authLoading ? <><LoaderCircle className="spin-icon" size={16} /> Please wait…</> : authMode === "signin" ? "Sign in" : "Create account"}</button>
          </form>
          <p className="auth-switch">{authMode === "signin" ? "New here?" : "Already have an account?"} <button type="button" onClick={() => { setAuthMode(authMode === "signin" ? "signup" : "signin"); setAuthError(""); setAuthNotice(""); }}>{authMode === "signin" ? "Create an account" : "Sign in"}</button></p>
          <button className="outline-button" type="button" style={{ width: "100%", marginTop: 10 }} onClick={() => setDemoMode(true)}>Continue in demo mode</button>
          <p className="auth-footnote">Each student’s saved predictions are private to their account. Demo model outputs are estimates, not academic decisions.</p>
        </section>
      </main>
    );
  }

  const currentStudentId = session
    ? String(session.user.user_metadata?.student_id || "Student account")
    : "Demo mode";

  return (
    <div className="app-shell" id="overview">
      <Sidebar active={activeNav} onNavigate={setActiveNav} />


      <main className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">Student workspace / Overview</div>
            <h1 className="page-title">Your learning overview</h1>
            <p className="page-subtitle">Enter your learning habits and request a prediction from the model.</p>
          </div>
          <div className="top-actions" id="account">
            <span className="student-id-chip">{currentStudentId}</span>
            {session && <button className="outline-button" type="button" onClick={handleSignOut}>Sign out</button>}
            <div className="avatar" aria-label={session ? "Signed-in student" : "Demo mode"}>{currentStudentId === "Student account" ? "S" : currentStudentId.slice(-1)}</div>
          </div>
        </header>

        <div className="demo-note">
          <CircleHelp size={16} style={{ flex: "0 0 auto", marginTop: 1 }} />
          <div><strong>Demonstration model.</strong> The API uses a small synthetic dataset. Results are estimates for learning and software demonstration only—not validated real-world predictions or a basis for academic decisions. {!supabase && "Demo mode is active because Supabase is not configured; predictions work without signing in, but saved history and accounts are unavailable."}</div>
        </div>

        <section className="panel prediction-panel" id="predict">
          <div className="panel-header">
            <div><h2 className="panel-title">Predict your score</h2><p className="panel-description">Fill in all seven fields. The API validates your values before running the model.</p></div>
            <span className="metric-icon" style={{ color: "var(--green)", background: "var(--green-soft)" }}><BrainCircuit size={16} /></span>
          </div>
          <div className="panel-body">
            <form onSubmit={handlePredict}>
              <div className="prediction-fields">
                {fields.map((field) => (
                  <label className="prediction-field" key={field.key}>
                    <span>{field.label}</span>
                    <input
                      type="number"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      required
                      value={features[field.key]}
                      onChange={(event) => setFeatures((current) => ({ ...current, [field.key]: Number(event.target.value) }))}
                      aria-describedby={`hint-${field.key}`}
                    />
                    <small id={`hint-${field.key}`}>{field.hint}</small>
                  </label>
                ))}
              </div>
              <div className="prediction-actions">
                <button className="outline-button" type="button" onClick={() => { setFeatures(initialFeatures); setPrediction(null); setError(""); }}>Reset values</button>
                <button className="predict-button" type="submit" disabled={loading}>
                  {loading ? <><LoaderCircle className="spin-icon" size={16} /> Running model…</> : <><Target size={16} /> Predict score</>}
                </button>
              </div>
            </form>

            {error && <div className="api-message api-error" role="alert"><AlertCircle size={18} /><div><strong>Prediction unavailable</strong><p>{error}</p><p>Make sure the FastAPI backend is running and NEXT_PUBLIC_API_URL points to it.</p></div></div>}
            {prediction && (
              <div className="prediction-result" aria-live="polite">
                <div className="result-heading"><CheckCircle2 size={18} /><strong>Prediction generated</strong></div>
                <div className="result-score">{prediction.predicted_score.toFixed(2)}<span> / 100</span></div>
                <p className="panel-description">{prediction.message}</p>
                <div className="result-meta"><span><strong>Model:</strong> {prediction.model_name}</span><span><strong>Dataset:</strong> {prediction.dataset}</span></div>
                <h3 className="result-subtitle">Suggested next steps</h3>
                <ul className="guidance-list">{prediction.guidance.map((tip) => <li key={tip}>{tip}</li>)}</ul>
                <p className="result-disclaimer">{prediction.disclaimer}</p>
              </div>
            )}
          </div>
        </section>

        <div className="metrics-grid" id="progress">
          <section className="panel metric-card">
            <div className="metric-heading"><span>Predicted score</span><span className="metric-icon"><Target size={16} /></span></div>
            <div className="metric-value">{prediction ? prediction.predicted_score.toFixed(1) : "—"} <span className="unit">/ 100</span></div>
            <div className="metric-foot">{prediction ? "Latest API response" : "Run a prediction to see your estimate"}</div>
            <div className="score-bar"><span style={{ width: `${prediction ? Math.max(0, Math.min(100, prediction.predicted_score)) : 0}%` }} /></div>
          </section>
          <MetricCard icon={CalendarDays} label="Attendance" value={String(features.attendance_percent)} unit="%" note="Your current form value" />
          <MetricCard icon={Clock3} label="Study time" value={String(features.study_hours_per_day)} unit="hrs/day" note="Your current form value" accent="green" />
          <MetricCard icon={BrainCircuit} label="Practice" value={String(features.practice_quizzes_per_week)} unit="sessions/week" note="Your current form value" accent="green" />
        </div>

        <div className="section-grid">
          <section className="panel">
            <div className="panel-header">
              <div><h2 className="panel-title">Score outlook</h2><p className="panel-description">Real score history will appear here when stored results are available.</p></div>
              <div className="legend"><span><i /> Actual</span><span><i className="green-dot" /> Estimate</span></div>
            </div>
            <div className="panel-body">
              <div className="demo-note" style={{ marginBottom: 12, padding: "8px 10px", fontSize: 11 }}>The line chart is illustrative. Your saved predictions appear in the private history list below.</div>
              <ScoreChart />
              <h3 className="result-subtitle">Recent saved predictions</h3>
              {history.length ? <ul className="guidance-list">{history.map((item) => <li key={item.id}>{Number(item.predicted_score).toFixed(1)} / 100 · {new Date(item.created_at).toLocaleString()}</li>)}</ul> : <p className="panel-description">No saved predictions yet. Run a prediction to start your private history.</p>}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div><h2 className="panel-title">Your next steps</h2><p className="panel-description">Recommendations returned by the API after you run a prediction.</p></div>
              <span className="metric-icon" style={{ color: "var(--green)", background: "var(--green-soft)" }}><Lightbulb size={16} /></span>
            </div>
            <div className="panel-body">
              {prediction ? (
                <ul className="guidance-list">{prediction.guidance.map((tip) => <li key={tip}>{tip}</li>)}</ul>
              ) : (
                <div className="action-list">
                  <div className="action-row"><div className="action-number">01</div><div><div className="action-title">Enter your habits</div><p className="action-copy">Use the prediction form above to share your current study pattern.</p></div></div>
                  <div className="action-row"><div className="action-number">02</div><div><div className="action-title">Run the model</div><p className="action-copy">Your inputs will be sent to the FastAPI backend for an estimate.</p></div></div>
                  <div className="action-row"><div className="action-number">03</div><div><div className="action-title">Review suggestions</div><p className="action-copy">Use the guidance as ideas to try, not guarantees of score improvement.</p></div></div>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="bottom-grid" id="dataset">
          <section className="panel">
            <div className="panel-header">
              <div><h2 className="panel-title">Factors to explore</h2><p className="panel-description">Inputs currently supported by the model.</p></div>
              <span className="status-pill"><ShieldCheck size={12} /> 7 input features</span>
            </div>
            <div className="panel-body">
              {fields.slice(0, 4).map((field) => (
                <div className="factor-row" key={field.key}>
                  <div className="factor-name">{field.label}</div>
                  <div className="factor-track"><div className="factor-fill" style={{ width: `${Math.max(0, Math.min(100, (features[field.key] / field.max) * 100))}%`, opacity: .65 }} /></div>
                  <div className="factor-pct">{features[field.key]}</div>
                </div>
              ))}
              <p className="panel-description" style={{ marginTop: 12 }}>These are input values, not feature-importance scores. A relationship learned by the model does not prove causation.</p>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div><h2 className="panel-title">Dataset health</h2><p className="panel-description">Understand data quality before trusting a result.</p></div>
              <span className="metric-icon"><Database size={16} /></span>
            </div>
            <div className="panel-body">
              <div className="dataset-stat"><div className="stat-number">CSV</div><div className="stat-label"><strong style={{ color: "#dce8f7" }}>Compact demo dataset</strong><br />100 synthetic rows; missing feature values are imputed during training.</div></div>
              <div className="dataset-stat"><div className="stat-number">ML</div><div className="stat-label"><strong style={{ color: "#dce8f7" }}>Model connected</strong><br />Prediction requests use the backend&apos;s trained Extra Trees model.</div></div>
              <div className="dataset-stat"><div className="stat-number"><Sparkles size={20} color="var(--green)" /></div><div className="stat-label"><strong style={{ color: "#dce8f7" }}>Actionable guidance</strong><br />Suggestions reflect the values submitted in your form.</div></div>
            </div>
          </section>
        </div>

        <footer className="footer-note">Student Performance Prediction System · Frontend-to-API integration · Demo estimates only. Student sign-in and saved prediction history use Supabase when configured. Demo estimates only.</footer>
      </main>
    </div>
  );
}
