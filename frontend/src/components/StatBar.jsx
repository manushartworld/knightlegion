import React from "react";

export default function StatBar({ label, value, max = 100, icon: Icon, color = "#a83246" }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div data-testid={`stat-bar-${label.toLowerCase()}`} className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-slate-400">
          {Icon && <Icon size={12} style={{ color }} />} {label}
        </span>
        <span className="font-heading text-sm text-slate-100">{value}</span>
      </div>
      <div className="stat-bar-track">
        <div className="stat-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
