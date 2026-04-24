import React from "react";
import RPGFrame from "../components/RPGFrame";
import Embers from "../components/Embers";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { Shield } from "lucide-react";

export default function Login() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-12 text-slate-400">…</div>;
  if (user) return <Navigate to="/" replace />;

  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div data-testid="login-page" className="relative min-h-[85vh] flex items-center justify-center px-6 hero-cinema">
      <Embers count={24} />
      <div className="relative z-10 w-full max-w-md">
        <RPGFrame className="p-10 text-center">
          <div className="w-16 h-16 mx-auto border border-[#D4AF37]/60 flex items-center justify-center mb-6 glow-pulse">
            <Shield size={28} className="text-[#D4AF37]" />
          </div>
          <h1 className="font-heading text-3xl text-slate-100 mb-2">Enter the Sanctum</h1>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            The codex recognises your soul by the sigil of Google. Sign the ledger to inscribe new chronicles.
          </p>
          <button
            onClick={handleLogin}
            data-testid="google-login-btn"
            className="rune-btn w-full justify-center"
          >
            Sign in with Google
          </button>
          <p className="text-[10px] tracking-[0.3em] uppercase text-slate-600 mt-8">
            Only archons may inscribe · All may read
          </p>
        </RPGFrame>
      </div>
    </div>
  );
}
