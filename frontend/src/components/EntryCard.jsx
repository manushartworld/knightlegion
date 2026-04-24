import React from "react";
import { Link } from "react-router-dom";
import RPGFrame from "./RPGFrame";
import { mediaUrl } from "../lib/api";
import { Swords, ShieldCheck, Heart, Sparkles } from "lucide-react";

const RARITY_COLORS = {
  common: "text-slate-300 border-slate-500/40",
  uncommon: "text-emerald-300 border-emerald-500/50",
  rare: "text-[#6b1f2b] border-[#6b1f2b]/60",
  epic: "text-[#a83246] border-[#a83246]/60",
  legendary: "text-[#D4AF37] border-[#D4AF37]/80",
  mythic: "text-[#E11D48] border-[#E11D48]/60",
};

export default function EntryCard({ entry }) {
  const stats = entry.stats || {};
  const rarity = (stats.rarity || "").toLowerCase();
  const rarityClass = RARITY_COLORS[rarity] || "text-slate-400 border-slate-500/30";
  const img = mediaUrl(entry.image_url);

  return (
    <Link
      to={`/e/${entry.id}`}
      data-testid={`entry-card-${entry.id}`}
      className="block group"
    >
      <RPGFrame glow className="overflow-hidden">
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#1a0b10] to-[#0b0b10]">
          {img ? (
            <img
              src={img}
              alt={entry.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Sparkles size={40} className="text-[#a83246]/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b10] via-transparent to-transparent" />
          {rarity && (
            <span
              className={`absolute top-3 left-3 text-[10px] tracking-[0.3em] uppercase px-2 py-1 border bg-black/60 backdrop-blur-md ${rarityClass}`}
            >
              {stats.rarity}
            </span>
          )}
          {stats.level && (
            <span className="absolute top-3 right-3 text-[10px] tracking-[0.2em] uppercase px-2 py-1 border border-[#D4AF37]/50 bg-black/60 text-[#D4AF37] backdrop-blur-md">
              Lv. {stats.level}
            </span>
          )}
        </div>

        <div className="p-5">
          <h3 className="font-heading text-lg text-slate-100 group-hover:text-[#D4AF37] transition-colors line-clamp-1">
            {entry.title}
          </h3>
          {entry.description && (
            <p className="text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">
              {entry.description}
            </p>
          )}

          {(stats.attack || stats.defense || stats.hp) && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#D4AF37]/10 text-xs">
              {stats.attack != null && (
                <span className="flex items-center gap-1 text-slate-300">
                  <Swords size={12} className="text-[#E11D48]" /> {stats.attack}
                </span>
              )}
              {stats.defense != null && (
                <span className="flex items-center gap-1 text-slate-300">
                  <ShieldCheck size={12} className="text-[#6b1f2b]" /> {stats.defense}
                </span>
              )}
              {stats.hp != null && (
                <span className="flex items-center gap-1 text-slate-300">
                  <Heart size={12} className="text-emerald-400" /> {stats.hp}
                </span>
              )}
            </div>
          )}
        </div>
      </RPGFrame>
    </Link>
  );
}
