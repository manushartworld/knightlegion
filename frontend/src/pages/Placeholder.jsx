import React from "react";
import RPGFrame from "../components/RPGFrame";
import { useAuth } from "../context/AuthContext";

export function Placeholder({ title, blurb, testid }) {
  return (
    <div data-testid={testid} className="px-6 md:px-12 lg:px-16 py-16">
      <span className="text-[11px] tracking-[0.4em] uppercase text-[#8B5CF6]">Codex</span>
      <h1 className="font-heading text-4xl sm:text-5xl text-slate-100 mt-2 mb-4">{title}</h1>
      <p className="text-slate-400 max-w-2xl mb-10">{blurb}</p>
      <RPGFrame className="p-12 text-center">
        <p className="font-heading text-xl text-[#D4AF37] mb-2">The scribes are gathering notes.</p>
        <p className="text-slate-400 text-sm">This chamber will open soon. Return to the main codex in the meantime.</p>
      </RPGFrame>
    </div>
  );
}

export function News() {
  return <Placeholder
    testid="news-page"
    title="News from the Realm"
    blurb="Decrees of the council, patch scrolls, seasonal proclamations."
  />;
}
export function Forums() {
  return <Placeholder
    testid="forums-page"
    title="Council Forums"
    blurb="Where archons and adventurers debate theory, loot and legend."
  />;
}
export function Library() {
  return <Placeholder
    testid="library-page"
    title="Library of Ages"
    blurb="Long-form lore, bestiary essays, and world chronicles."
  />;
}

export function Account() {
  const { user } = useAuth();
  if (!user) return <Placeholder testid="account-page" title="Account" blurb="Sign in to view your sigil." />;
  return (
    <div data-testid="account-page" className="px-6 md:px-12 lg:px-16 py-16 max-w-3xl">
      <span className="text-[11px] tracking-[0.4em] uppercase text-[#8B5CF6]">Sigil</span>
      <h1 className="font-heading text-4xl sm:text-5xl text-slate-100 mt-2 mb-10">Account</h1>
      <RPGFrame className="p-8">
        <div className="flex items-center gap-6">
          {user.picture && (
            <img src={user.picture} alt="" className="w-20 h-20 border border-[#D4AF37]/50 object-cover" />
          )}
          <div>
            <div className="font-heading text-2xl text-slate-100">{user.name}</div>
            <div className="text-slate-400 text-sm mt-1">{user.email}</div>
            <div className="mt-3 text-[10px] tracking-[0.3em] uppercase">
              {user.is_admin ? (
                <span className="text-[#D4AF37] border border-[#D4AF37]/50 px-2 py-1">Archon</span>
              ) : (
                <span className="text-slate-500 border border-slate-700 px-2 py-1">Adept</span>
              )}
            </div>
          </div>
        </div>
      </RPGFrame>
    </div>
  );
}
