import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash || "";
    const match = hash.match(/session_id=([^&]+)/);
    const sessionId = match ? decodeURIComponent(match[1]) : null;

    if (!sessionId) {
      navigate("/login", { replace: true });
      return;
    }

    (async () => {
      try {
        const res = await api.post("/auth/session", { session_id: sessionId });
        setUser(res.data);
        // Clean URL
        window.history.replaceState(null, "", window.location.pathname);
        navigate("/", { replace: true, state: { user: res.data } });
      } catch (e) {
        navigate("/login", { replace: true });
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[11px] tracking-[0.4em] uppercase text-slate-400">Binding your sigil…</p>
      </div>
    </div>
  );
}
