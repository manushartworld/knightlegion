import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Shield, User, LogOut, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { SidebarNav } from "./Sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const LINKS = [
  { to: "/news", label: "News" },
  { to: "/forums", label: "Forums" },
  { to: "/library", label: "Library" },
];

export default function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // close drawer when user navigates
  React.useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <header
      data-testid="top-nav"
      className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#0b0b10]/80 border-b border-[#D4AF37]/20"
    >
      <div className="mx-auto px-4 sm:px-6 md:px-10 py-3 sm:py-4 flex items-center justify-between gap-3">
        {/* Left: hamburger (mobile) + brand */}
        <div className="flex items-center gap-2 min-w-0">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                data-testid="mobile-menu-toggle"
                aria-label="Open menu"
                className="lg:hidden w-10 h-10 flex items-center justify-center border border-[#D4AF37]/40 bg-black/40 text-[#D4AF37] hover:border-[#a83246] hover:text-[#a83246]"
              >
                <Menu size={18} />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="bg-[#0b0b10] border-r border-[#D4AF37]/20 p-0 w-[82vw] sm:max-w-xs flex flex-col text-slate-200"
              data-testid="mobile-sidebar-sheet"
            >
              <div className="px-5 pt-5 pb-4 border-b border-[#D4AF37]/10">
                <span className="font-heading text-lg tracking-[0.3em] text-mystic">AETHRYL</span>
                <div className="text-[10px] tracking-[0.4em] text-slate-500 uppercase mt-1">Codex</div>
              </div>
              <SidebarNav onNavigate={() => setOpen(false)} />
              <div className="border-t border-[#D4AF37]/10 p-4 flex flex-col gap-1.5">
                {LINKS.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className="text-xs tracking-[0.25em] uppercase text-slate-400 hover:text-[#D4AF37] py-2"
                  >
                    {l.label}
                  </Link>
                ))}
                {!user && (
                  <Link to="/login" className="rune-btn mt-2 justify-center">
                    Sign In
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" data-testid="brand-link" className="flex items-center gap-2 sm:gap-3 group min-w-0">
            <div className="w-9 h-9 shrink-0 border border-[#D4AF37]/60 flex items-center justify-center bg-black/40 group-hover:border-[#a83246] transition-colors">
              <Shield size={18} className="text-[#D4AF37] group-hover:text-[#a83246] transition-colors" />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-heading text-lg tracking-[0.3em] text-mystic">AETHRYL</span>
              <span className="text-[10px] tracking-[0.4em] text-slate-500 uppercase">Codex</span>
            </div>
          </Link>
        </div>

        {/* Right: links + auth */}
        <nav className="flex items-center gap-1 sm:gap-3 md:gap-6 shrink-0">
          {/* Links hidden on < md; mobile sees them in drawer */}
          <div className="hidden md:flex items-center gap-2 lg:gap-5">
            {LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                data-testid={`nav-link-${l.label.toLowerCase()}`}
                className="link-glow text-xs lg:text-sm tracking-[0.25em] uppercase font-medium text-slate-300 hover:text-[#D4AF37] px-2 py-1"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="account-menu-btn"
                  className="flex items-center gap-2 pl-2 pr-2 sm:pl-3 py-1.5 border border-[#D4AF37]/40 bg-black/40 hover:border-[#a83246] hover:bg-[#a83246]/10 transition-all"
                >
                  {user.picture ? (
                    <img src={user.picture} alt="" className="w-7 h-7 rounded-full border border-[#D4AF37]/50" />
                  ) : (
                    <User size={16} className="text-[#D4AF37]" />
                  )}
                  <span className="text-xs tracking-[0.2em] uppercase hidden md:inline">
                    {user.is_admin ? "Archon" : user.name?.split(" ")[0] || "Account"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#14090d] border-[#D4AF37]/30 text-slate-200 rounded-none">
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
              className="rune-btn text-[10px] sm:text-xs px-3 sm:px-6"
            >
              <User size={14} />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
