"use client";
import { useState, type FormEvent } from "react";
import Sidebar from "../../components/Sidebar";
import { Target, LoaderCircle, AlertCircle, CheckCircle2 } from "lucide-react";
const API_URL=(process.env.NEXT_PUBLIC_API_URL||"https://student-performance-prediction-51f4.onrender.com").replace(/\/$/,"");
const fields=[
{key:"study_hours_per_day",label:"Study hours per day",min:0,max:24,step:.5,initial:2.5},
{key:"attendance_percent",label:"Attendance (%)",min:0,max:100,step:1,initial:85},
{key:"assignment_completion_percent",label:"Assignment completion (%)",min:0,max:100,step:1,initial:80},
{key:"practice_quizzes_per_week",label:"Practice quizzes per week",min:0,max:100,step:1,initial:3},
{key:"class_participation_score",label:"Class participation (0–10)",min:0,max:10,step:1,initial:6},
{key:"previous_score",label:"Previous score",min:0,max:100,step:1,initial:70},
{key:"sleep_hours",label:"Sleep hours per day",min:0,max:24,step:.5,initial:7.5},
] as const;
type Features=Record<(typeof fields)[number]["key"],number>;
type Result={predicted_score:number;model_name:string;dataset:string;guidance:string[];disclaimer:string;message:string};
const initial=Object.fromEntries(fields.map(f=>[f.key,f.initial])) as Features;
export default function PredictPage(){
const [features,setFeatures]=useState<Features>(initial);const [result,setResult]=useState<Result|null>(null);const [error,setError]=useState("");const [loading,setLoading]=useState(false);
async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setError("");setResult(null);setLoading(true);try{const res=await fetch(API_URL+"/api/predict",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({features})});const body=await res.json().catch(()=>({}));if(!res.ok)throw new Error(body.detail||"Prediction request failed.");setResult(body as Result);}catch(err){setError(err instanceof Error?err.message:"Could not reach prediction API.");}finally{setLoading(false);}}
return <div className="app-shell"><Sidebar active="Predict score"/><main className="main"><header className="topbar"><div><div className="eyebrow">Workspace / Prediction</div><h1 className="page-title">Predict your score</h1><p className="page-subtitle">Enter your current habits to get an indicative model estimate and study suggestions.</p></div></header><div className="demo-note"><AlertCircle size={16}/><span>Demo model trained on synthetic data. Results are for learning and demonstration only, not real academic decisions.</span></div>
<section className="panel"><div className="panel-header"><div><h2 className="panel-title">Student learning habits</h2><p className="panel-description">Use realistic values. Inputs are validated by the API.</p></div><Target size={19}/></div><div className="panel-body"><form onSubmit={submit}><div className="prediction-fields">{fields.map(f=><label className="prediction-field" key={f.key}><span>{f.label}</span><input type="number" min={f.min} max={f.max} step={f.step} required value={features[f.key]} onChange={e=>setFeatures(p=>({...p,[f.key]:Number(e.target.value)}))}/></label>)}</div><div className="prediction-actions"><button className="outline-button" type="button" onClick={()=>{setFeatures(initial);setResult(null);setError("");}}>Reset values</button><button className="predict-button" disabled={loading} type="submit">{loading?<><LoaderCircle className="spin-icon" size={16}/> Predicting…</>:<><Target size={16}/> Predict score</>}</button></div></form>{error&&<div className="api-message api-error" role="alert"><AlertCircle size={17}/><p>{error}</p></div>}{result&&<div className="prediction-result" aria-live="polite"><div className="result-heading"><CheckCircle2 size={18}/><strong>Prediction generated</strong></div><div className="result-score">{result.predicted_score.toFixed(2)}<span> / 100</span></div><p className="panel-description">{result.message}</p><p className="panel-description">Model: {result.model_name} · Dataset: {result.dataset}</p><h3 className="result-subtitle">Suggested next steps</h3><ul className="guidance-list">{result.guidance.map(t=><li key={t}>{t}</li>)}</ul><p className="result-disclaimer">{result.disclaimer}</p></div>}</div></section></main></div>;
}
