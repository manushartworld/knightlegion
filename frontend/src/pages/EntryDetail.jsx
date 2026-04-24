import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Swords, ShieldCheck, Heart, Zap, Gauge, Star, Trash2, Edit3, ExternalLink } from "lucide-react";
import { api, mediaUrl } from "../lib/api";
import RPGFrame from "../components/RPGFrame";
import StatBar from "../components/StatBar";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

function getYoutubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.searchParams.get("v")) return u.searchParams.get("v");
  } catch { return null; }
  return null;
}

export default function EntryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/entries/${id}`);
        setEntry(res.data);
      } catch (e) { setEntry(null); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Banish this entry from the codex?")) return;
    try {
      await api.delete(`/entries/${id}`);
      toast.success("Entry banished.");
      navigate(`/c/${entry.category}/${entry.subcategory}`);
    } catch (e) { toast.error("Could not delete."); }
  };

  if (loading) return <div className="p-12 text-slate-400">Consulting the archives…</div>;
  if (!entry) return (
    <div className="p-12 text-center">
      <h1 className="font-heading text-3xl">Nothing here</h1>
      <Link to="/" className="rune-btn mt-6 inline-flex">Return to the Codex</Link>
    </div>
  );

  const stats = entry.stats || {};
  const img = mediaUrl(entry.image_url);
  const ytId = getYoutubeId(entry.youtube_url);

  return (
    <div data-testid="entry-detail-page" className="px-6 md:px-12 lg:px-16 py-10">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[11px] tracking-[0.3em] uppercase text-slate-500 hover:text-[#D4AF37] mb-6"
      >
        <ArrowLeft size={12} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5">
          <RPGFrame className="p-3">
            <div className="relative aspect-[3/4] bg-gradient-to-br from-[#1a0b10] to-[#0b0b10] overflow-hidden">
              {img ? (
                <img src={img} alt={entry.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">No image</div>
              )}
              {stats.rarity && (
                <span className="absolute top-4 left-4 text-[10px] tracking-[0.3em] uppercase px-3 py-1.5 border border-[#D4AF37]/80 bg-black/60 text-[#D4AF37] backdrop-blur-md">
                  {stats.rarity}
                </span>
              )}
            </div>
          </RPGFrame>
        </div>

        <div className="lg:col-span-7">
          <div className="text-[11px] tracking-[0.4em] uppercase text-[#a83246] mb-2">
            {entry.category} / {entry.subcategory}
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl text-slate-100 mb-4">{entry.title}</h1>
          {entry.description && (
            <p className="text-slate-300 leading-relaxed mb-8 whitespace-pre-line">{entry.description}</p>
          )}

          {/* Stats */}
          {(stats.attack != null || stats.defense != null || stats.hp != null || stats.mana != null || stats.speed != null) && (
            <RPGFrame className="p-6 mb-8">
              <div className="text-[11px] tracking-[0.4em] uppercase text-[#D4AF37] mb-5">Attributes</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
                {stats.attack != null && <StatBar label="Attack" value={stats.attack} max={1000} icon={Swords} color="#E11D48" />}
                {stats.defense != null && <StatBar label="Defense" value={stats.defense} max={1000} icon={ShieldCheck} color="#6b1f2b" />}
                {stats.hp != null && <StatBar label="HP" value={stats.hp} max={5000} icon={Heart} color="#10B981" />}
                {stats.mana != null && <StatBar label="Mana" value={stats.mana} max={500} icon={Zap} color="#a83246" />}
                {stats.speed != null && <StatBar label="Speed" value={stats.speed} max={200} icon={Gauge} color="#F59E0B" />}
                {stats.level != null && <StatBar label="Level" value={stats.level} max={100} icon={Star} color="#D4AF37" />}
              </div>
            </RPGFrame>
          )}

          {/* Video */}
          {ytId && (
            <RPGFrame className="p-3 mb-8">
              <div className="aspect-video">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                  title={entry.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </RPGFrame>
          )}

          {/* Admin actions */}
          {user?.is_admin && (
            <div className="flex gap-3 mt-6 pt-6 border-t border-[#D4AF37]/10">
              <button onClick={() => navigate(`/admin?edit=${entry.id}`)} data-testid="entry-edit-btn" className="rune-btn">
                <Edit3 size={14} /> Edit
              </button>
              <button onClick={handleDelete} data-testid="entry-delete-btn" className="rune-btn ghost text-red-400 border-red-500/40 hover:border-red-500">
                <Trash2 size={14} /> Banish
              </button>
            </div>
          )}

          {entry.youtube_url && !ytId && (
            <a href={entry.youtube_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-[#D4AF37] hover:underline mt-4">
              Watch guide <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
