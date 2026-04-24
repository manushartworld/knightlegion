import React from "react";
import { X } from "lucide-react";
import RPGFrame from "./RPGFrame";
import ItemIconTile from "./ItemIconTile";
import { prettyLabel, allFields, GRADE_STYLES, isMeaningful } from "../lib/itemsHelpers";

function FieldValue({ value }) {
  if (value == null || value === "") return <span className="text-slate-600">—</span>;
  if (typeof value === "boolean") return <span className="text-slate-200">{String(value)}</span>;
  return <span className="text-slate-100">{String(value)}</span>;
}

// Render one enchantment tier as a column of all its fields.
function TierColumn({ item, highlight }) {
  const fields = allFields(item);
  return (
    <div className="min-w-[220px]">
      <div className={`mb-3 text-[10px] tracking-[0.3em] uppercase px-2 py-1 border inline-block ${GRADE_STYLES[item.itemGrade] || GRADE_STYLES.default}`}>
        {item.itemGrade || "Tier"}{highlight ? ` · ${highlight}` : ""}
      </div>
      <dl className="space-y-1.5">
        {fields.map((k) => (
          <div key={k} className="flex items-center justify-between gap-4 text-xs border-b border-[#D4AF37]/5 py-1">
            <dt className="text-slate-500 tracking-wide">{prettyLabel(k)}</dt>
            <dd className="font-mono"><FieldValue value={item[k]} /></dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function ItemDetailModal({ group, onClose }) {
  if (!group) return null;
  const { base, items } = group;
  const grade = base.itemGrade || "";
  const gradeCls = GRADE_STYLES[grade] || GRADE_STYLES.default;

  // Primary summary fields: non-zero keys of base
  const summaryKeys = allFields(base).filter((k) => {
    if (k === "itemName" || k === "itemGrade" || k === "iconName") return false;
    return isMeaningful(base[k]);
  });

  return (
    <div
      data-testid="item-detail-modal"
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl max-h-[92vh] overflow-hidden"
      >
        <RPGFrame className="relative max-h-[92vh] flex flex-col">
          <button
            onClick={onClose}
            data-testid="item-detail-close"
            className="absolute top-4 right-4 w-9 h-9 border border-[#D4AF37]/50 bg-black/60 flex items-center justify-center text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#a83246]/10 z-10"
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-[#D4AF37]/10 flex gap-5 items-center">
            <ItemIconTile item={base} size="lg" />
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                {grade && (
                  <span className={`text-[10px] tracking-[0.3em] uppercase px-2 py-1 border ${gradeCls}`}>
                    {grade}
                  </span>
                )}
                {base.type && (
                  <span className="text-[10px] tracking-[0.3em] uppercase text-slate-500">{base.type}</span>
                )}
                {base.hand && (
                  <span className="text-[10px] tracking-[0.3em] uppercase text-slate-500">{base.hand}</span>
                )}
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl text-slate-100 mt-2 truncate">
                {base.itemName}
              </h2>
              {base.permitted && (
                <p className="text-[11px] tracking-[0.3em] uppercase text-[#a83246] mt-1">
                  Wielded by · {base.permitted}
                </p>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 overflow-y-auto">
            {/* Summary */}
            {summaryKeys.length > 0 && (
              <section className="mb-8">
                <div className="text-[10px] tracking-[0.4em] uppercase text-[#D4AF37] mb-4">Attributes</div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
                  {summaryKeys.map((k) => (
                    <div key={k} className="flex items-center justify-between border-b border-[#D4AF37]/8 py-2 text-sm">
                      <dt className="text-slate-400">{prettyLabel(k)}</dt>
                      <dd className="font-mono text-slate-100"><FieldValue value={base[k]} /></dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {/* All fields on base (including zeros) */}
            <section className="mb-8">
              <div className="text-[10px] tracking-[0.4em] uppercase text-slate-500 mb-3">Raw Fields</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                {allFields(base).map((k) => (
                  <div key={k} className="flex items-center justify-between border-b border-white/5 py-1.5 text-xs">
                    <dt className="text-slate-500">{prettyLabel(k)}</dt>
                    <dd className="font-mono text-slate-300"><FieldValue value={base[k]} /></dd>
                  </div>
                ))}
              </div>
            </section>

            {/* Enchantment tiers */}
            {items.length > 1 && (
              <section>
                <div className="text-[10px] tracking-[0.4em] uppercase text-[#a83246] mb-4">
                  Enchantment Tiers · {items.length}
                </div>
                <div className="flex gap-6 overflow-x-auto pb-4">
                  {items.map((it, i) => (
                    <TierColumn key={i} item={it} highlight={`+${i}`} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </RPGFrame>
      </div>
    </div>
  );
}
