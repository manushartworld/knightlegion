import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { CATEGORIES } from "../lib/categories";

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState(() =>
    Object.fromEntries(CATEGORIES.map((c) => [c.slug, true]))
  );

  const toggle = (slug) => setOpenGroups((o) => ({ ...o, [slug]: !o[slug] }));

  return (
    <aside
      data-testid="sidebar"
      className={`hidden lg:flex flex-col sticky top-[64px] h-[calc(100vh-64px)] bg-[#0e0509] border-r border-[#D4AF37]/15 transition-[width] duration-300 ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
    >
      <button
        data-testid="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-end gap-2 px-4 py-3 text-[11px] tracking-[0.3em] uppercase text-slate-500 hover:text-[#D4AF37] transition-colors border-b border-[#D4AF37]/10"
      >
        {!collapsed && <span>Collapse</span>}
        {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
      </button>

      <nav className="flex-1 overflow-y-auto py-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isOpen = openGroups[cat.slug];
          return (
            <div key={cat.slug} className="mb-2" data-testid={`sidebar-group-${cat.slug}`}>
              <button
                onClick={() => !collapsed && toggle(cat.slug)}
                className={`w-full flex items-center ${collapsed ? "justify-center" : "justify-between"} px-4 py-2.5 text-xs tracking-[0.3em] uppercase font-heading text-[#D4AF37]/90 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 transition-colors`}
                title={cat.label}
              >
                <span className="flex items-center gap-3">
                  <Icon size={16} className="text-[#a83246]" />
                  {!collapsed && <span>{cat.label}</span>}
                </span>
                {!collapsed && (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
              </button>

              {isOpen && !collapsed && (
                <div className="pl-4 pr-2 py-1 space-y-1">
                  {cat.children.map((sub) => {
                    const SubIcon = sub.icon;
                    const to = `/c/${cat.slug}/${sub.slug}`;
                    const active = location.pathname === to;
                    return (
                      <NavLink
                        key={sub.slug}
                        to={to}
                        data-testid={`sidebar-link-${cat.slug}-${sub.slug}`}
                        className={`sidebar-item flex items-center gap-3 px-3 py-2 text-sm border-l-2 ${
                          active
                            ? "border-[#D4AF37] bg-[#a83246]/10 text-[#D4AF37]"
                            : "border-transparent text-slate-400 hover:text-slate-100 hover:border-[#a83246]/70 hover:bg-[#a83246]/5"
                        }`}
                      >
                        <SubIcon size={13} className="opacity-70" />
                        <span>{sub.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-[#D4AF37]/10">
          <div className="text-[10px] tracking-[0.3em] uppercase text-slate-500">
            Build <span className="text-[#D4AF37]">v1.0</span>
          </div>
        </div>
      )}
    </aside>
  );
}
