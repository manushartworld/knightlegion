import React, { useState, useMemo } from "react";
import { X, ChevronUp, ChevronDown } from "lucide-react";
import RPGFrame from "./RPGFrame";
import ItemIconTile from "./ItemIconTile";
import { prettyLabel, statFields, GRADE_STYLES, rarityTokens, isMeaningful } from "../lib/itemsHelpers";

function formatValue(v) {
  if (v == null || v === "") return "—";
  if (typeof v === "boolean") return String(v);
  return String(v);
}

function delta(curr, base) {
  const a = Number(curr);
  const b = Number(base);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  const d = a - b;
  if (d === 0) return null;
  return d;
}

export default function ItemDetailModal({ group, onClose }) {
  const [level, setLevel] = useState(0);
  const items = group?.items || [];
  const maxLevel = Math.max(0, items.length - 1);

  const safeLevel = Math.min(level, maxLevel);
  const current = items[safeLevel] || group?.base;
  const baseline = items[0] || group?.base;

  const fields = useMemo(() => statFields(current || {}), [current]);

  if (!group || !current) return null;
  const grade = current.itemGrade || "";
  const gradeCls = GRADE_STYLES[grade] || GRADE_STYLES.default;
  const tokens = rarityTokens(grade);
  const description = current.comment_en || current.description || "";
  const gradeLabel =
    grade === "Middle" ? "Mid Class"
    : grade === "High" ? "High Class"
    : grade === "Low" ? "Low Class"
    : grade;

  return (
    <div
      data-testid="item-detail-modal"
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[94vh] overflow-hidden"
      >
        <RPGFrame
          className="relative flex flex-col max-h-[94vh]"
          style={{ boxShadow: `0 0 0 1px ${tokens.border}, 0 0 40px ${tokens.glow}` }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            data-testid="item-detail-close"
            className="absolute top-3 right-3 w-9 h-9 border border-[#D4AF37]/50 bg-black/60 flex items-center justify-center text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#a83246]/10 z-10"
          >
            <X size={16} />
          </button>

          <div className="overflow-y-auto">
            {/* 1. Item preview: icon + upgrade selector grouped together */}
            <div className="px-6 pt-8 pb-5 flex flex-col items-center border-b border-[#D4AF37]/15 bg-gradient-to-b from-[#0b0b10] to-[#14090d]/60">
              <ItemIconTile item={current} size="lg" />

              {/* +0 to +N selector — always single horizontal row, scrolls if needed */}
              {maxLevel > 0 && (
                <div className="mt-5 w-full" data-testid="item-upgrade-selector">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[10px] tracking-[0.4em] uppercase text-[#D4AF37]">Enhancement</span>
                    <span className="text-[10px] tracking-[0.3em] uppercase text-slate-500">
                      {maxLevel + 1} tiers
                    </span>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto flex-nowrap scrollbar-thin pb-1 -mx-1 px-1 snap-x">
                    {items.map((_, i) => {
                      const active = i === safeLevel;
                      return (
                        <button
                          key={i}
                          data-testid={`upgrade-level-${i}`}
                          onClick={() => setLevel(i)}
                          className={`shrink-0 snap-start flex-none w-[42px] h-9 px-2 text-xs font-mono tracking-wider border transition-all ${
                            active
                              ? "bg-[#a83246] text-white border-[#D4AF37] shadow-[0_0_12px_rgba(168,50,70,0.7)]"
                              : "bg-[#14090d] border-[#D4AF37]/25 text-slate-300 hover:border-[#a83246] hover:text-[#D4AF37]"
                          }`}
                        >
                          +{i}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Name + rarity */}
            <div className="px-6 pt-5 pb-4 text-center border-b border-[#D4AF37]/10">
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {gradeLabel && (
                  <span className={`text-[10px] tracking-[0.3em] uppercase px-2 py-1 border ${gradeCls}`}>
                    {gradeLabel}
                  </span>
                )}
                {current.type && (
                  <span className="text-[10px] tracking-[0.3em] uppercase text-slate-500">{current.type}</span>
                )}
                {current.hand && (
                  <span className="text-[10px] tracking-[0.3em] uppercase text-slate-500">{current.hand}</span>
                )}
                {maxLevel > 0 && (
                  <span className="text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] border border-[#D4AF37]/40 px-2 py-1 bg-black/40">
                    +{safeLevel}
                  </span>
                )}
              </div>
              <h2 className={`font-heading text-2xl sm:text-3xl mt-3 ${tokens.name}`}>
                {current.itemName}
              </h2>
              {current.permitted && (
                <p className="text-[11px] tracking-[0.3em] uppercase text-[#a83246] mt-1">
                  Wielded by · {current.permitted}
                </p>
              )}
            </div>

            {/* 3. Stat table — single column */}
            <div className="px-6 py-5">
              <div className="text-[10px] tracking-[0.4em] uppercase text-slate-500 mb-3">
                Stats · Level +{safeLevel}
              </div>
              <table data-testid="item-stat-table" className="w-full text-sm font-mono">
                <tbody>
                  {fields.map((k) => {
                    const v = current[k];
                    const d = safeLevel > 0 ? delta(v, baseline?.[k]) : null;
                    return (
                      <tr key={k} className="border-b border-[#D4AF37]/8 hover:bg-[#a83246]/5">
                        <td className="py-2.5 pr-4 text-slate-400 tracking-wider uppercase text-[11px] font-sans">
                          {prettyLabel(k)}
                        </td>
                        <td className="py-2.5 text-right text-slate-100 whitespace-nowrap">
                          <span className={isMeaningful(v) ? "" : "text-slate-600"}>{formatValue(v)}</span>
                          {d != null && (
                            <span
                              className={`ml-3 inline-flex items-center gap-0.5 text-[10px] ${
                                d > 0 ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {d > 0 ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                              {d > 0 ? `+${d}` : d}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 4. Description */}
            {description && (
              <div className="px-6 pb-6">
                <div className="text-[10px] tracking-[0.4em] uppercase text-slate-500 mb-2">Description</div>
                <p className="text-sm text-slate-300 leading-relaxed italic">
                  {description}
                </p>
              </div>
            )}
          </div>
        </RPGFrame>
      </div>
    </div>
  );
}
