"use client";

import Link from "next/link";
import {
  BrainCircuit, ChartNoAxesCombined, Database, GraduationCap,
  LayoutDashboard, Target, UserRound, Lightbulb,
} from "lucide-react";

const items = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Predict score", href: "/predict", icon: Target },
  { label: "Train the model", href: "/train-model", icon: BrainCircuit },
  { label: "Improve my performance", href: "/improve", icon: Lightbulb },
  { label: "My progress", href: "/progress", icon: ChartNoAxesCombined },
  { label: "Dataset lab", href: "/dataset", icon: Database },
  { label: "Account", href: "/account", icon: UserRound },
];

export default function Sidebar({ active = "Overview", onNavigate }: { active?: string; onNavigate?: (label: string) => void }) {
  return (
    <aside className="sidebar">
      <Link className="brand" href="/" style={{ textDecoration: "none", color: "inherit" }}>
        <div className="brand-mark"><GraduationCap size={22} /></div>
        <div><div className="brand-name">StudyInsight</div><div className="brand-sub">Learn · Improve · Grow</div></div>
      </Link>
      <div className="nav-label">Workspace</div>
      <nav className="nav-list" aria-label="Main navigation">
        {items.map(({ label, href, icon: Icon }) => (
          <Link
            className={`nav-item ${active === label ? "active" : ""}`}
            key={label}
            href={href}
            aria-current={active === label ? "page" : undefined}
            onClick={() => onNavigate?.(label)}
          >
            <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div style={{ color: "#b8cce0", marginBottom: 7 }}><span className="online-dot" />Model API integration</div>
        Predictions use the deployed model. Training is a separate workflow and is not enabled by the current API.
      </div>
    </aside>
  );
}
