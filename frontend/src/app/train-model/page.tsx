"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import { BrainCircuit, FileUp, LoaderCircle, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://student-performance-prediction-51f4.onrender.com").replace(/\/$/, "");
type TrainingResult = {
  candidate_id: string; rows_used: number; train_rows: number; test_rows: number;
  metrics: { mae: number; rmse: number; r2: number | null };
  feature_importance: { feature: string; importance: number }[];
  status: string; message: string;
};

export default function TrainModelPage() {
  const [file, setFile] = useState<File | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [result, setResult] = useState<TrainingResult | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function train(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); setResult(null);
    if (!file) { setError("Choose a CSV dataset first."); return; }
    if (file.size > 12 * 1024 * 1024) { setError("CSV uploads are limited to 12 MiB."); return; }
    setLoading(true);
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch(API_URL + "/api/train", { method: "POST", headers: { "X-Training-Token": token }, body: form });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.detail || "Training request failed.");
      setResult(body as TrainingResult);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not reach the training API."); }
    finally { setLoading(false); }
  }
  async function promote() {
    if (!result) return;
    if (!window.confirm("Promote this candidate to the active prediction model? Review the held-out metrics and dataset quality first.")) return;
    setError(""); setMessage(""); setPromoting(true);
    try {
      const response = await fetch(API_URL + "/api/train/" + result.candidate_id + "/promote", { method: "POST", headers: { "X-Training-Token": token } });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.detail || "Promotion failed.");
      setMessage(body.message || "Candidate promoted.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not promote the candidate."); }
    finally { setPromoting(false); }
  }
  return <div className="app-shell"><Sidebar active="Train the model" /><main className="main">
    <header className="topbar"><div><div className="eyebrow">Workspace / Model development</div><h1 className="page-title">Train the model</h1><p className="page-subtitle">Upload a labelled dataset, evaluate a candidate on held-out rows, and review before promotion.</p></div><span className="metric-icon"><BrainCircuit size={20}/></span></header>
    <div className="demo-note"><ShieldCheck size={17}/><div><strong>Protected operator workflow.</strong> Configure <code>TRAINING_API_TOKEN</code> on the backend and enter it below. The token is used only for these requests and is not saved in browser storage. Training does not automatically replace the live model.</div></div>
    <section className="panel"><div className="panel-header"><div><h2 className="panel-title">Train a candidate model</h2><p className="panel-description">CSV must contain seven supported features and a numeric final_score column (0–100).</p></div><FileUp size={18}/></div>
      <div className="panel-body"><form className="auth-form" onSubmit={train}>
        <label className="prediction-field"><span>Training operator token</span><input type="password" value={token} onChange={e=>setToken(e.target.value)} autoComplete="off" required placeholder="Enter TRAINING_API_TOKEN"/></label>
        <label className="prediction-field"><span>Dataset CSV (max 12 MiB)</span><input type="file" accept=".csv,text/csv" onChange={e=>setFile(e.target.files?.[0]||null)} required/><small>Only the required model columns are used. Data quality and feature ranges are validated before training.</small></label>
        <button className="predict-button" type="submit" disabled={loading||!file}>{loading?<><LoaderCircle className="spin-icon" size={16}/> Training and evaluating…</>:<><BrainCircuit size={16}/> Train candidate</>}</button>
      </form>
      {error&&<div className="api-message api-error" role="alert"><AlertCircle size={17}/><p>{error}</p></div>}
      {message&&<div className="api-message" role="status"><CheckCircle2 size={17}/><p>{message}</p></div>}
      </div>
    </section>
    {result&&<section className="panel" style={{marginTop:16}}><div className="panel-header"><div><h2 className="panel-title">Candidate evaluation</h2><p className="panel-description">{result.message}</p></div><span className="status-pill">Not active</span></div><div className="panel-body">
      <div className="metrics-grid"><div className="panel metric-card"><div className="metric-heading">Rows used</div><div className="metric-value">{result.rows_used}</div></div><div className="panel metric-card"><div className="metric-heading">Test MAE</div><div className="metric-value">{result.metrics.mae}</div></div><div className="panel metric-card"><div className="metric-heading">Test RMSE</div><div className="metric-value">{result.metrics.rmse}</div></div><div className="panel metric-card"><div className="metric-heading">Test R²</div><div className="metric-value">{result.metrics.r2 ?? "—"}</div></div></div>
      <h3 className="result-subtitle">Feature importance (candidate only)</h3><ul className="guidance-list">{result.feature_importance.map(x=><li key={x.feature}>{x.feature.replaceAll("_"," ")} — {(x.importance*100).toFixed(1)}%</li>)}</ul>
      <div className="demo-note"><AlertCircle size={16}/><span>Metrics are only meaningful if the dataset is representative and correctly labelled. They do not prove real-world validity or fairness. Candidate artifacts may be lost on restart unless candidate storage is persistent.</span></div>
      <button className="predict-button" type="button" onClick={promote} disabled={promoting}>{promoting?<><LoaderCircle className="spin-icon" size={16}/> Promoting…</>:<>Promote candidate <ArrowRight size={16}/></>}</button>
    </div></section>}
    <section className="panel" style={{marginTop:16}}><div className="panel-body"><h2 className="panel-title">Required CSV columns</h2><p className="panel-description">study_hours_per_day, attendance_percent, assignment_completion_percent, practice_quizzes_per_week, class_participation_score, previous_score, sleep_hours, final_score.</p><p className="panel-description" style={{marginTop:8}}>Promotion requires a configured durable <code>ACTIVE_MODEL_PATH</code> on the backend. If not configured, the active model remains unchanged.</p><Link className="outline-button" href="/dataset">Review dataset requirements</Link></div></section>
  </main></div>;
}
