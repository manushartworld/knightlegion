import React, { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, LayoutGrid, AlertTriangle } from "lucide-react";
import RPGFrame from "../components/RPGFrame";
import ItemIconTile from "../components/ItemIconTile";
import ItemDetailModal from "../components/ItemDetailModal";
import { useJsonData } from "../lib/jsonData";
import { findCategory, findSub } from "../lib/categories";
import {
  ITEMS_SUB_TO_KEYS,
  flattenToGroups,
  sortGroups,
  GRADE_ORDER,
  GRADE_STYLES,
  PRIMARY_STATS,
  prettyLabel,
  isMeaningful,
  rarityTokens,
} from "../lib/itemsHelpers";

function ItemCard({ group, onOpen }) {
  const { base } = group;
  const gradeCls = GRADE_STYLES[base.itemGrade] || GRADE_STYLES.default;
  const tokens = rarityTokens(base.itemGrade);
  // pick up to 2 meaningful primary stats for the card footer
  const shownStats = PRIMARY_STATS.filter((k) => isMeaningful(base[k])).slice(0, 2);
  const gradeLabel =
    base.itemGrade === "Middle" ? "Mid Class"
    : base.itemGrade === "High" ? "High Class"
    : base.itemGrade === "Low" ? "Low Class"
    : base.itemGrade || "";

  return (
    <button
      onClick={() => onOpen(group)}
      data-testid={`item-card-${base.iconName || base.itemName}`}
      className="text-left group"
    >
      <RPGFrame glow className="p-4 h-full flex flex-col gap-4">
        <div className="flex gap-4 items-start">
          <ItemIconTile item={base} size="md" />
          <div className="min-w-0 flex-1">
            {base.itemGrade && (
              <span className={`text-[9px] tracking-[0.3em] uppercase px-2 py-0.5 border inline-block ${gradeCls}`}>
                {gradeLabel}
              </span>
            )}
            <h3 className={`font-heading text-base transition-colors mt-2 line-clamp-2 leading-snug ${tokens.name} group-hover:brightness-125`}>
              {base.itemName}
            </h3>
            <div className="flex gap-3 mt-1 text-[10px] tracking-[0.25em] uppercase text-slate-500">
              {base.type && <span>{base.type}</span>}
              {base.hand && <span>{base.hand}</span>}
            </div>
          </div>
        </div>

        {shownStats.length > 0 && (
          <div className="flex gap-4 pt-3 border-t border-[#D4AF37]/10 text-xs">
            {shownStats.map((k) => (
              <div key={k} className="flex flex-col">
                <span className="text-[9px] tracking-[0.2em] uppercase text-slate-500">{prettyLabel(k)}</span>
                <span className="font-mono text-slate-100">{base[k]}</span>
              </div>
            ))}
          </div>
        )}

        {base.comment_en && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{base.comment_en}</p>
        )}

        {base.permitted && (
          <div className="text-[9px] tracking-[0.3em] uppercase text-[#a83246]">
            {base.permitted}
          </div>
        )}
      </RPGFrame>
    </button>
  );
}

export default function ItemsCategory() {
  const { sub } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useJsonData("items");
  const cat = findCategory("items");
  const subInfo = findSub("items", sub);

  const [q, setQ] = useState("");
  const [grade, setGrade] = useState("All");
  const [type, setType] = useState("All");
  const [permitted, setPermitted] = useState("All");
  const [visible, setVisible] = useState(60);

  const keys = ITEMS_SUB_TO_KEYS[sub] || [];

  const groups = useMemo(() => sortGroups(flattenToGroups(data, keys)), [data, keys]);

  // Derive filter options from data
  const grades = useMemo(() => {
    const s = new Set();
    groups.forEach((g) => g.base.itemGrade && s.add(g.base.itemGrade));
    const sorted = Array.from(s).sort((a, b) => GRADE_ORDER.indexOf(a) - GRADE_ORDER.indexOf(b));
    return ["All", ...sorted];
  }, [groups]);

  const types = useMemo(() => {
    const s = new Set();
    groups.forEach((g) => g.base.type && s.add(g.base.type));
    return ["All", ...Array.from(s).sort()];
  }, [groups]);

  const permits = useMemo(() => {
    const s = new Set();
    groups.forEach((g) => g.base.permitted && s.add(g.base.permitted));
    return ["All", ...Array.from(s).sort()];
  }, [groups]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return groups.filter((g) => {
      const b = g.base;
      if (needle) {
        const hay = `${b.itemName || ""} ${b.type || ""} ${b.iconName || ""} ${b.comment_en || ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (grade !== "All" && b.itemGrade !== grade) return false;
      if (type !== "All" && b.type !== type) return false;
      if (permitted !== "All" && b.permitted !== permitted) return false;
      return true;
    });
  }, [groups, q, grade, type, permitted]);

  const [openGroup, setOpenGroup] = useState(null);

  if (!cat || !subInfo) {
    return (
      <div className="p-12 text-center">
        <h1 className="font-heading text-3xl">Unknown fragment</h1>
        <button className="rune-btn mt-6" onClick={() => navigate("/")}>Return</button>
      </div>
    );
  }

  return (
    <div data-testid={`items-category-${sub}`} className="px-6 md:px-12 lg:px-16 py-10">
      <nav className="flex items-center gap-3 text-[11px] tracking-[0.3em] uppercase text-slate-500 mb-6">
        <Link to="/" className="hover:text-[#D4AF37]">Codex</Link>
        <span>/</span>
        <span className="text-slate-400">Items</span>
        <span>/</span>
        <span className="text-[#D4AF37]">{subInfo.label}</span>
      </nav>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[11px] tracking-[0.3em] uppercase text-slate-500 hover:text-[#D4AF37] mb-3">
            <ArrowLeft size={12} /> Back
          </button>
          <h1 className="font-heading text-4xl sm:text-5xl text-slate-100">{subInfo.label}</h1>
          <p className="text-slate-400 mt-2 max-w-xl">
            Live inventory — driven by <span className="text-[#a83246]">items.json</span>. Update the file, reload, and the codex reflects your changes.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] tracking-[0.3em] uppercase text-slate-500">
          <LayoutGrid size={12} />
          <span>{filtered.length} / {groups.length} entries</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            data-testid="items-search"
            value={q}
            onChange={(e) => { setQ(e.target.value); setVisible(60); }}
            placeholder="Search the armoury…"
            className="w-full bg-[#14090d] border border-[#D4AF37]/30 pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#a83246] focus:outline-none"
          />
        </div>
        {grades.length > 1 && (
          <Select testid="items-grade" icon={<Filter size={12} />} value={grade} onChange={(v) => { setGrade(v); setVisible(60); }} options={grades} label="Grade" />
        )}
        {types.length > 1 && (
          <Select testid="items-type" value={type} onChange={(v) => { setType(v); setVisible(60); }} options={types} label="Type" />
        )}
        {permits.length > 1 && (
          <Select testid="items-permit" value={permitted} onChange={(v) => { setPermitted(v); setVisible(60); }} options={permits} label="Class" />
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <RPGFrame key={i} className="h-40 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <RPGFrame className="p-10 text-center">
          <AlertTriangle className="mx-auto text-[#a83246] mb-3" />
          <p className="text-slate-300">Failed to load items.json from the vault.</p>
          <p className="text-xs text-slate-500 mt-1">Place a valid JSON at <code>/app/backend/data/items.json</code>.</p>
        </RPGFrame>
      )}

      {!loading && !error && filtered.length === 0 && (
        <RPGFrame className="p-12 text-center">
          <p className="font-heading text-xl text-[#D4AF37] mb-2">No relics match your decree.</p>
          <p className="text-slate-400 text-sm">Try loosening your filters.</p>
        </RPGFrame>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.slice(0, visible).map((g, i) => (
              <ItemCard key={`${g.sourceKey}-${g.base.iconName}-${i}`} group={g} onOpen={setOpenGroup} />
            ))}
          </div>
          {visible < filtered.length && (
            <div className="flex justify-center mt-10">
              <button onClick={() => setVisible((v) => v + 60)} data-testid="items-load-more" className="rune-btn ghost">
                Reveal More ({filtered.length - visible} remaining)
              </button>
            </div>
          )}
        </>
      )}

      {openGroup && <ItemDetailModal group={openGroup} onClose={() => setOpenGroup(null)} />}
    </div>
  );
}

function Select({ value, onChange, options, label, icon, testid }) {
  return (
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>}
      <select
        data-testid={testid}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-[#14090d] border border-[#D4AF37]/30 ${icon ? "pl-9" : "pl-3"} pr-8 py-2.5 text-xs tracking-[0.15em] uppercase text-slate-100 focus:border-[#a83246] focus:outline-none appearance-none`}
      >
        {options.map((o) => (
          <option key={o} value={o}>{label ? `${label}: ${o}` : o}</option>
        ))}
      </select>
    </div>
  );
}
