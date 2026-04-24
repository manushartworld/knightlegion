import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, User, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const links = [
  { to: "/news", label: "News" },
  { to: "/forums", label: "Forums" },
  { to: "/library", label: "Library" },
];

export default function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header
      data-testid="top-nav"
      className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#0A0A0F]/80 border-b border-[#D4AF37]/20"
    >
      <div className="mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
        <Link to="/" data-testid="brand-link" className="flex items-center gap-3 group">
          <div className="w-9 h-9 border border-[#D4AF37]/60 flex items-center justify-center bg-black/40 group-hover:border-[#8B5CF6] transition-colors">
            <Shield size={18} className="text-[#D4AF37] group-hover:text-[#8B5CF6] transition-colors" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-heading text-lg tracking-[0.3em] text-mystic">AETHRYL</span>
            <span className="text-[10px] tracking-[0.4em] text-slate-500 uppercase">Codex</span>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-6">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              data-testid={`nav-link-${l.label.toLowerCase()}`}
              className="link-glow text-sm tracking-[0.25em] uppercase font-medium text-slate-300 hover:text-[#D4AF37] px-2 py-1"
            >
              {l.label}
            </Link>
          ))}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="account-menu-btn"
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 border border-[#D4AF37]/40 bg-black/40 hover:border-[#8B5CF6] hover:bg-[#8B5CF6]/10 transition-all"
                >
                  {user.picture ? (
                    <img src={user.picture} alt="" className="w-7 h-7 rounded-full border border-[#D4AF37]/50" />
                  ) : (
                    <User size={16} className="text-[#D4AF37]" />
                  )}
                  <span className="text-xs tracking-[0.2em] uppercase hidden sm:inline">
                    {user.is_admin ? "Archon" : user.name?.split(" ")[0] || "Account"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#12121A] border-[#D4AF37]/30 text-slate-200 rounded-none">
                <DropdownMenuLabel className="font-heading text-[#D4AF37]">{user.name}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#D4AF37]/20" />
                <DropdownMenuItem onClick={() => navigate("/account")} data-testid="menu-account" className="cursor-pointer">
                  <User size={14} className="mr-2" /> Account
                </DropdownMenuItem>
                {user.is_admin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")} data-testid="menu-admin" className="cursor-pointer text-[#D4AF37]">
                    <Shield size={14} className="mr-2" /> Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-[#D4AF37]/20" />
                <DropdownMenuItem onClick={async () => { await logout(); navigate("/"); }} data-testid="menu-logout" className="cursor-pointer text-red-400">
                  <LogOut size={14} className="mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              data-testid="nav-login-btn"
              className="rune-btn text-xs"
            >
              <User size={14} /> Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
