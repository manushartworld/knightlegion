import React from "react";
import { Link } from "react-router-dom";
import RPGFrame from "./RPGFrame";
import { ArrowRight } from "lucide-react";

export default function CategoryCard({ category, index = 0 }) {
  const Icon = category.icon;
  const firstChild = category.children[0];
  const href = `/c/${category.slug}/${firstChild.slug}`;

  return (
    <Link
      to={href}
      data-testid={`category-card-${category.slug}`}
      className="block group"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <RPGFrame glow className="p-8 h-full min-h-[220px] flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="w-14 h-14 flex items-center justify-center border border-[#D4AF37]/40 bg-[#8B5CF6]/10 group-hover:bg-[#8B5CF6]/20 group-hover:border-[#8B5CF6] transition-all">
            <Icon size={24} className="text-[#D4AF37] group-hover:text-[#E2E8F0] transition-colors" />
          </div>
          <span className="text-[10px] tracking-[0.3em] uppercase text-slate-500">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <div>
          <h3 className="font-heading text-2xl mt-6 mb-2 text-slate-100 group-hover:text-[#D4AF37] transition-colors">
            {category.label}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {category.blurb}
          </p>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#D4AF37]/10">
          <span className="text-[11px] tracking-[0.3em] uppercase text-slate-500">
            {category.children.length} branches
          </span>
          <ArrowRight
            size={16}
            className="text-[#8B5CF6] group-hover:translate-x-1 group-hover:text-[#D4AF37] transition-all"
          />
        </div>
      </RPGFrame>
    </Link>
  );
}
