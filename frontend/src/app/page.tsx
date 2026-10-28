import {
  Activity, ArrowDownRight, ArrowUpRight, BookOpen, BrainCircuit, CalendarDays,
  ChartNoAxesCombined, ChevronDown, CircleHelp, Clock3, Database, GraduationCap,
  LayoutDashboard, Lightbulb, Settings2, ShieldCheck, Sparkles, Target, UserRound,
} from "lucide-react";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Predict score", icon: Target, active: false },
  { label: "My progress", icon: ChartNoAxesCombined, active: false },
  { label: "Dataset lab", icon: Database, active: false },
  { label: "Account", icon: UserRound, active: false },
];

const factors = [
  { name: "Study hours", value: 78, label: "—" },
  { name: "Attendance", value: 66, label: "—" },
  { name: "Previous score", value: 58, label: "—" },
  { name: "Practice quizzes", value: 42, label: "—" },
];

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
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><GraduationCap size={22} /></div>
          <div><div className="brand-name">StudyInsight</div><div className="brand-sub">Learn · Improve · Grow</div></div>
        </div>
        <div className="nav-label">Workspace</div>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon, active }) => (
            <button className={`nav-item${active ? " active" : ""}`} key={label} type="button" aria-current={active ? "page" : undefined}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div style={{ color: "#b8cce0", marginBottom: 7 }}><span className="online-dot" />Workspace preview</div>
          Built around your learning data, with recommendations you can act on.
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">Student workspace / Overview</div>
            <h1 className="page-title">Your learning overview</h1>
            <p className="page-subtitle">A clearer view of your habits, progress, and next steps.</p>
          </div>
          <div className="top-actions">
            <button className="outline-button" type="button"><CalendarDays size={15} /> Sample view <ChevronDown size={14} /></button>
            <div className="avatar" aria-label="Demo student profile">S</div>
          </div>
        </header>

        <div className="demo-note">
          <CircleHelp size={16} style={{ flex: "0 0 auto", marginTop: 1 }} />
          <div><strong>Design preview — illustrative data.</strong> These values and charts are placeholders used to shape the interface. They are not a real student prediction and will be replaced by data from your existing model.</div>
        </div>

        <div className="metrics-grid">
          <section className="panel metric-card">
            <div className="metric-heading"><span>Predicted score</span><span className="metric-icon"><Target size={16} /></span></div>
            <div className="metric-value">— <span className="unit">/ 100</span></div>
            <div className="metric-foot">Run a prediction to see your estimate</div>
            <div className="score-bar"><span style={{ width: "0%" }} /></div>
          </section>
          <MetricCard icon={CalendarDays} label="Attendance" value="—" unit="%" note="Connect your student inputs" />
          <MetricCard icon={Clock3} label="Study time" value="—" unit="hrs/day" note="Based on your submitted values" accent="green" />
          <MetricCard icon={BrainCircuit} label="Practice" value="—" unit="sessions/week" note="Set a realistic weekly goal" accent="green" />
        </div>

        <div className="section-grid">
          <section className="panel">
            <div className="panel-header">
              <div><h2 className="panel-title">Score outlook</h2><p className="panel-description">A place for actual results and model estimates over time.</p></div>
              <div className="legend"><span><i /> Actual</span><span><i className="green-dot" /> Estimate</span></div>
            </div>
            <div className="panel-body">
              <div className="demo-note" style={{ marginBottom: 12, padding: "8px 10px", fontSize: 11 }}>Chart below is illustrative only; real history is not connected yet.</div>
              <ScoreChart />
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div><h2 className="panel-title">Your next steps</h2><p className="panel-description">Practical actions based on your inputs will appear here.</p></div>
              <span className="metric-icon" style={{ color: "var(--green)", background: "var(--green-soft)" }}><Lightbulb size={16} /></span>
            </div>
            <div className="panel-body">
              <div className="action-list">
                <div className="action-row"><div className="action-number">01</div><div><div className="action-title">Build a steady study routine</div><p className="action-copy">Recommendations will use the study hours you enter, not a generic target.</p></div></div>
                <div className="action-row"><div className="action-number">02</div><div><div className="action-title">Practice with purpose</div><p className="action-copy">Use quiz frequency and assignment completion to identify manageable next steps.</p></div></div>
                <div className="action-row"><div className="action-number">03</div><div><div className="action-title">Review your progress</div><p className="action-copy">Compare future results only when actual history is available.</p></div></div>
              </div>
            </div>
          </section>
        </div>

        <div className="bottom-grid">
          <section className="panel">
            <div className="panel-header">
              <div><h2 className="panel-title">Factors to explore</h2><p className="panel-description">Model feature importance will be shown here after training.</p></div>
              <span className="status-pill"><ShieldCheck size={12} /> Model-linked later</span>
            </div>
            <div className="panel-body">
              {factors.map((factor) => (
                <div className="factor-row" key={factor.name}>
                  <div className="factor-name">{factor.name}</div>
                  <div className="factor-track"><div className="factor-fill" style={{ width: factor.value + "%", opacity: .65 }} /></div>
                  <div className="factor-pct">{factor.label}</div>
                </div>
              ))}
              <p className="panel-description" style={{ marginTop: 12 }}>Feature importance describes model behavior; it does not prove that a factor causes a score to change.</p>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div><h2 className="panel-title">Dataset health</h2><p className="panel-description">Understand data quality before trusting a result.</p></div>
              <span className="metric-icon"><Database size={16} /></span>
            </div>
            <div className="panel-body">
              <div className="dataset-stat"><div className="stat-number">CSV</div><div className="stat-label"><strong style={{ color: "#dce8f7" }}>Upload a dataset</strong><br />Inspect columns, types, and missing values.</div></div>
              <div className="dataset-stat"><div className="stat-number">ML</div><div className="stat-label"><strong style={{ color: "#dce8f7" }}>Review model quality</strong><br />See holdout metrics before using predictions.</div></div>
              <div className="dataset-stat"><div className="stat-number"><Sparkles size={20} color="var(--green)" /></div><div className="stat-label"><strong style={{ color: "#dce8f7" }}>Actionable guidance</strong><br />Receive suggestions based on your own values.</div></div>
            </div>
          </section>
        </div>

        <footer className="footer-note">Student Performance Prediction System · Preview build · Predictions are estimates, not guarantees. This interface is not connected to authentication or the model yet.</footer>
      </main>
    </div>
  );
}