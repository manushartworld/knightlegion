import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Search, Filter, ArrowLeft } from "lucide-react";
import { api } from "../lib/api";
import { findCategory, findSub } from "../lib/categories";
import EntryCard from "../components/EntryCard";
import VideoCard from "../components/VideoCard";
import RPGFrame from "../components/RPGFrame";

const RARITIES = ["All", "Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"];

export default function Category() {
  const { category, sub } = useParams();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [q, setQ] = useState("");
  const [rarity, setRarity] = useState("All");
  const [loading, setLoading] = useState(true);

  const cat = findCategory(category);
  const subInfo = findSub(category, sub);

  useEffect(() => {
    if (!cat || !subInfo) return;
    setLoading(true);
    (async () => {
      try {
        const res = await api.get("/entries", {
          params: { category, subcategory: sub, limit: 200 },
        });
        setEntries(res.data || []);
      } catch (e) { setEntries([]); }
      finally { setLoading(false); }
    })();
  }, [category, sub, cat, subInfo]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (q.trim()) {
        const t = q.toLowerCase();
        if (!e.title.toLowerCase().includes(t) && !(e.description || "").toLowerCase().includes(t)) return false;
      }
      if (rarity !== "All") {
        if ((e.stats?.rarity || "").toLowerCase() !== rarity.toLowerCase()) return false;
      }
      return true;
    });
  }, [entries, q, rarity]);

  if (!cat || !subInfo) {
    return (
      <div className="p-12 text-center">
        <h1 className="font-heading text-3xl">Unknown fragment</h1>
        <p className="text-slate-400 mt-2">The codex has no record of this path.</p>
        <button className="rune-btn mt-6" onClick={() => navigate("/")}>Return</button>
      </div>
    );
  }

  const isVideos = category === "tutorials" && sub === "videos";

  return (
    <div data-testid={`category-page-${category}-${sub}`} className="px-6 md:px-12 lg:px-16 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-3 text-[11px] tracking-[0.3em] uppercase text-slate-500 mb-6">
        <Link to="/" className="hover:text-[#D4AF37]">Codex</Link>
        <span>/</span>
        <span className="text-slate-400">{cat.label}</span>
        <span>/</span>
        <span className="text-[#D4AF37]">{subInfo.label}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[11px] tracking-[0.3em] uppercase text-slate-500 hover:text-[#D4AF37] mb-3"
          >
            <ArrowLeft size={12} /> Back
          </button>
          <h1 className="font-heading text-4xl sm:text-5xl text-slate-100">
            {subInfo.label}
          </h1>
          <p className="text-slate-400 mt-2 max-w-xl">{cat.blurb}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              data-testid="category-search-input"
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by name…"
              className="bg-[#0b0b10] border border-[#D4AF37]/30 pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#a83246] focus:outline-none w-full sm:w-64"
            />
          </div>
          {!isVideos && (
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <select
                data-testid="rarity-filter"
                value={rarity}
                onChange={(e) => setRarity(e.target.value)}
                className="bg-[#0b0b10] border border-[#D4AF37]/30 pl-9 pr-8 py-2.5 text-sm text-slate-100 focus:border-[#a83246] focus:outline-none appearance-none tracking-[0.15em] uppercase"
              >
                {RARITIES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <RPGFrame key={i} className="aspect-[4/3] animate-pulse bg-[#14090d]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <RPGFrame className="p-16 text-center">
          <p className="font-heading text-xl text-[#D4AF37] mb-2">The archive is silent.</p>
          <p className="text-slate-400 text-sm">No entries yet. An archon must inscribe them.</p>
        </RPGFrame>
      ) : isVideos ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((e) => <VideoCard key={e.id} entry={e} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((e) => <EntryCard key={e.id} entry={e} />)}
        </div>
      )}
    </div>
  );
}
