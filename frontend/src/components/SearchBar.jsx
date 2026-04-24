import React, { useEffect, useState, useRef } from "react";
import { Search, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function SearchBar({ autoFocus = false, placeholder = "Search artifacts, heroes, mechanics..." }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get("/entries", { params: { q, limit: 8 } });
        setResults(res.data);
        setOpen(true);
      } catch (e) { setResults([]); }
      finally { setLoading(false); }
    }, 220);
    return () => clearTimeout(debounceRef.current);
  }, [q]);

  const go = (id) => {
    setOpen(false);
    setQ("");
    navigate(`/e/${id}`);
  };

  return (
    <div className="relative w-full max-w-2xl" data-testid="search-container">
      <div className="relative">
        <Search
          size={18}
          className="absolute left-5 top-1/2 -translate-y-1/2 text-[#D4AF37]/70 pointer-events-none"
        />
        <Sparkles
          size={16}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-[#8B5CF6] float-slow pointer-events-none"
        />
        <input
          data-testid="search-codex-input"
          autoFocus={autoFocus}
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="w-full bg-[#0A0A0F]/70 border border-[#D4AF37]/40 pl-14 pr-14 py-5 text-lg text-slate-100 placeholder:text-slate-500 backdrop-blur-md focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/40 shadow-[0_0_30px_rgba(0,0,0,0.6)] transition-all font-['Outfit']"
        />
      </div>

      {open && (results.length > 0 || loading) && (
        <div
          data-testid="search-results"
          className="absolute mt-2 w-full bg-[#0A0A0F]/95 border border-[#D4AF37]/30 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-30"
        >
          {loading && (
            <div className="px-5 py-4 text-sm text-slate-400">Consulting the arcane archives…</div>
          )}
          {!loading && results.map((r) => (
            <button
              key={r.id}
              onMouseDown={() => go(r.id)}
              className="w-full text-left px-5 py-3 flex items-center justify-between hover:bg-[#8B5CF6]/10 border-b border-[#D4AF37]/10 last:border-b-0 group"
            >
              <div>
                <div className="text-slate-100 group-hover:text-[#D4AF37] font-heading text-base">
                  {r.title}
                </div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-slate-500 mt-0.5">
                  {r.category} / {r.subcategory}
                </div>
              </div>
              <ArrowRight size={16} className="text-[#8B5CF6] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
          {!loading && results.length === 0 && q && (
            <div className="px-5 py-4 text-sm text-slate-500">No entries found in the codex.</div>
          )}
        </div>
      )}
    </div>
  );
}
