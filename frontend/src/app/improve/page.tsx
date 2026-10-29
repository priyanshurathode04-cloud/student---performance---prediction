import Link from "next/link";
import Sidebar from "../../components/Sidebar";

const advice = [
  { title: "Build a consistent study routine", detail: "Set a realistic daily study block, split it into focused sessions, and review what you learned at the end." },
  { title: "Practice active recall", detail: "Close your notes and try to explain the concept or solve a question from memory before checking the answer." },
  { title: "Use spaced revision", detail: "Revisit important topics after a day, several days, and a week instead of cramming everything into one sitting." },
  { title: "Complete assignments early", detail: "Treat assignments as practice. Review every mistake and note the underlying concept you need to strengthen." },
  { title: "Use quizzes to find gaps", detail: "Take short practice quizzes regularly and spend extra time on questions you answered incorrectly." },
  { title: "Protect sleep and ask for help", detail: "Keep a steady sleep schedule and contact a teacher or classmate when you are stuck for more than one study session." },
];

export default function ImprovePage() {
  return (
    <div className="app-shell">
      <Sidebar active="Improve my performance" />
      <main className="main">
        <header className="topbar"><div><div className="eyebrow">Workspace / Personal improvement</div><h1 className="page-title">What can you do to improve?</h1><p className="page-subtitle">Practical actions you can start using this week—not promises of a particular score.</p></div></header>
        <div className="demo-note"><strong>Make progress measurable.</strong><span>Pick two actions, follow them for one week, then review what helped. Individual results vary, and the model estimate is not a guarantee.</span></div>
        <div className="section-grid">
          {advice.map((item, index) => <section className="panel" key={item.title}><div className="panel-body"><div className="action-row"><div className="action-number">{String(index + 1).padStart(2, "0")}</div><div><h2 className="panel-title">{item.title}</h2><p className="panel-description">{item.detail}</p></div></div></div></section>)}
        </div>
        <section className="panel"><div className="panel-header"><div><h2 className="panel-title">Turn advice into a plan</h2><p className="panel-description">Use your current habits to get model-generated suggestions as well.</p></div></div><div className="panel-body"><Link className="predict-button" href="/predict">Get my score estimate and suggestions</Link></div></section>
      </main>
    </div>
  );
}
