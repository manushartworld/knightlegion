import React, { useState } from "react";
import RPGFrame from "./RPGFrame";
import { Play, X } from "lucide-react";
import { mediaUrl } from "../lib/api";

function getYoutubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    // /embed/<id> or /shorts/<id>
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts[0] === "embed" || parts[0] === "shorts") return parts[1];
  } catch {
    return null;
  }
  return null;
}

export default function VideoCard({ entry }) {
  const [open, setOpen] = useState(false);
  const ytId = getYoutubeId(entry.youtube_url);
  const thumb = mediaUrl(entry.image_url) || (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : null);

  return (
    <>
      <div
        data-testid={`video-card-${entry.id}`}
        className="group cursor-pointer"
        onClick={() => ytId && setOpen(true)}
      >
        <RPGFrame glow className="overflow-hidden">
          <div className="relative aspect-video bg-gradient-to-br from-[#1A1A24] to-[#0A0A0F]">
            {thumb ? (
              <img
                src={thumb}
                alt={entry.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                <Play size={40} />
              </div>
            )}

            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors duration-300 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-[#E11D48]/80 flex items-center justify-center backdrop-blur-md shadow-[0_0_20px_rgba(225,29,72,0.6)] group-hover:scale-110 transition-transform">
                <Play size={22} className="text-white ml-1" fill="currentColor" />
              </div>
            </div>

            {entry.duration && (
              <span className="absolute bottom-3 right-3 text-[10px] tracking-[0.15em] px-2 py-1 bg-black/80 text-[#D4AF37] border border-[#D4AF37]/30 font-mono">
                {entry.duration}
              </span>
            )}
          </div>

          <div className="p-4">
            <h4 className="font-heading text-base text-slate-100 group-hover:text-[#D4AF37] transition-colors line-clamp-2">
              {entry.title}
            </h4>
            {entry.description && (
              <p className="text-xs text-slate-400 mt-2 line-clamp-1">{entry.description}</p>
            )}
          </div>
        </RPGFrame>
      </div>

      {open && ytId && (
        <div
          data-testid="video-modal"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button
            data-testid="video-modal-close"
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            className="absolute top-6 right-6 w-10 h-10 border border-[#D4AF37]/50 bg-black/60 flex items-center justify-center text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#D4AF37]/10"
          >
            <X size={18} />
          </button>
          <div className="w-full max-w-5xl aspect-video" onClick={(e) => e.stopPropagation()}>
            <iframe
              className="w-full h-full border-2 border-[#D4AF37]/50"
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
              title={entry.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
}
