import Link from "next/link";
import Sidebar from "../../components/Sidebar";

const steps = [
  ["01", "Prepare a dataset", "Upload a CSV with clearly documented student-performance features and a target score column."],
  ["02", "Validate the data", "Check required columns, missing values, duplicates, ranges, and potential data leakage."],
  ["03", "Train and evaluate", "Train a candidate model and evaluate it on held-out data using suitable regression metrics such as MAE and RMSE."],
  ["04", "Review before publishing", "Compare against the current model, record the dataset version and metrics, and only deploy after review."],
];

export default function TrainModelPage() {
  return (
    <div className="app-shell">
      <Sidebar active="Train the model" />
      <main className="main">
        <header className="topbar"><div><div className="eyebrow">Workspace / Model development</div><h1 className="page-title">Train the model</h1><p className="page-subtitle">A dedicated space for preparing data, training, and evaluating a student-performance model.</p></div></header>
        <div className="api-message api-error" role="status"><strong>Training is not connected yet.</strong><p>The deployed FastAPI backend currently supports score prediction, not model training. This page does not pretend to train or replace the live model.</p></div>
        <section className="panel" style={{ marginTop: 18 }}>
          <div className="panel-header"><div><h2 className="panel-title">Training workflow</h2><p className="panel-description">These are the steps needed to make model training real and safe.</p></div><span className="status-pill">Planned workflow</span></div>
          <div className="panel-body"><div className="action-list">{steps.map(([number, title, description]) => <div className="action-row" key={number}><div className="action-number">{number}</div><div><div className="action-title">{title}</div><p className="action-copy">{description}</p></div></div>)}</div></div>
        </section>
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header"><div><h2 className="panel-title">Current model status</h2><p className="panel-description">What the application can do today.</p></div><span className="metric-icon"><BrainCircuit size={16} /></span></div>
          <div className="panel-body"><ul className="guidance-list"><li>Accept student study-habit features and return a predicted score.</li><li>Return improvement guidance alongside a prediction.</li><li>Training jobs, dataset uploads, evaluation reports, and model publishing are not available through the current backend.</li></ul><Link className="predict-button" href="/#predict">Go to score prediction</Link></div>
        </section>
      </main>
    </div>
  );
}
