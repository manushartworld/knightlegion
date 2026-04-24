import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Embers from "../components/Embers";
import CategoryCard from "../components/CategoryCard";
import VideoCard from "../components/VideoCard";
import RPGFrame from "../components/RPGFrame";
import StatBar from "../components/StatBar";
import { HERO_CATEGORY_CARDS } from "../lib/categories";
import { api, mediaUrl } from "../lib/api";
import { Swords, ShieldCheck, Heart, Zap, Flame, ArrowRight, Video } from "lucide-react";

const FALLBACK_HERO_IMG =
  "https://static.prod-images.emergentagent.com/jobs/4d80fd22-fbc5-408f-a8f7-3c9249d31b3b/images/c1314429f7f5212db82097de293c9558ad5b0a92c5e36d356c8e82ab923f798f.png";

export default function Home() {
  const [featured, setFeatured] = useState(null);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [f, v] = await Promise.all([
          api.get("/entries/featured"),
          api.get("/entries", { params: { category: "tutorials", subcategory: "videos", limit: 6 } }),
        ]);
        setFeatured(f.data);
        setVideos(v.data || []);
      } catch (e) { /* empty */ }
    })();
  }, []);

  const hero = featured;
  const heroStats = hero?.stats || {};
  const heroImg = mediaUrl(hero?.image_url) || FALLBACK_HERO_IMG;

  return (
    <div data-testid="home-page" className="relative">
      {/* HERO */}
      <section className="relative hero-cinema min-h-[88vh] flex items-center">
        <Embers count={36} />
        <div className="relative z-10 w-full px-6 md:px-12 lg:px-20 py-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-[1px] bg-[#D4AF37]" />
              <span className="text-[11px] tracking-[0.5em] uppercase text-[#D4AF37]">
                The Aethryl Codex
              </span>
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-7xl leading-[1.05] text-slate-100 mb-4">
              A living <span className="text-mystic">grimoire</span>
              <br />
              of the realm.
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-xl mb-10 leading-relaxed">
              Chronicle of heroes, artifacts, rituals and the mechanics that bind them. Consult the archives, watch the masters, forge your legend.
            </p>
            <SearchBar />
            <div className="mt-6 flex flex-wrap gap-6 text-[11px] tracking-[0.3em] uppercase text-slate-500">
              <span>Heroes</span><span className="text-[#D4AF37]">◆</span>
              <span>Weapons</span><span className="text-[#D4AF37]">◆</span>
              <span>Craft</span><span className="text-[#D4AF37]">◆</span>
              <span>Orbs</span>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 float-slow">
          <div className="w-6 h-10 border border-[#D4AF37]/50 flex justify-center pt-2">
            <span className="w-[2px] h-2 bg-[#D4AF37]" />
          </div>
        </div>
      </section>

      {/* CATEGORY CARDS */}
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className="ornate-rule mb-10">
          <span className="font-heading text-xs tracking-[0.4em] uppercase">Arcana Index</span>
        </div>
        <div className="flex items-end justify-between mb-10">
          <h2 className="font-heading text-3xl sm:text-4xl text-slate-100">
            Choose your <span className="text-mystic">path</span>
          </h2>
          <p className="hidden md:block text-sm text-slate-400 max-w-md">
            Four realms of knowledge await. Each codex fragment, a step closer to mastery.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {HERO_CATEGORY_CARDS.map((cat, i) => (
            <CategoryCard key={cat.slug} category={cat} index={i} />
          ))}
        </div>
      </section>

      {/* FEATURED HERO */}
      <section className="px-6 md:px-12 lg:px-20 py-20 bg-gradient-to-b from-[#0b0b10] via-[#14090d] to-[#0b0b10] relative overflow-hidden">
        <div className="absolute inset-0 noise-overlay" />
        <div className="relative">
          <div className="ornate-rule mb-10">
            <span className="font-heading text-xs tracking-[0.4em] uppercase">Featured Champion</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5">
              <RPGFrame className="p-3 bg-gradient-to-b from-[#1a0b10] to-[#0b0b10]">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={heroImg}
                    alt={hero?.title || "Featured Champion"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b10] via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]">
                      Lv. {heroStats.level || 99} · {heroStats.rarity || "Legendary"}
                    </div>
                  </div>
                </div>
              </RPGFrame>
            </div>

            <div className="lg:col-span-7">
              <span className="text-[11px] tracking-[0.4em] uppercase text-[#a83246]">
                {hero ? `${hero.category} / ${hero.subcategory}` : "Characters / Heroes"}
              </span>
              <h3 className="font-heading text-4xl sm:text-5xl mt-3 mb-5 text-slate-100">
                {hero?.title || "Kael of the Silver Vow"}
              </h3>
              <p className="text-slate-300 leading-relaxed mb-8 max-w-xl">
                {hero?.description ||
                  "A paladin forged in the ashes of the Broken Crown. Wielder of solar runes, breaker of sieges. His blade sings to the void and answers only to the oath sworn at dawn."}
              </p>

              <div className="grid grid-cols-2 gap-x-10 gap-y-5 max-w-lg">
                <StatBar label="Attack" value={heroStats.attack ?? 820} max={1000} icon={Swords} color="#E11D48" />
                <StatBar label="Defense" value={heroStats.defense ?? 640} max={1000} icon={ShieldCheck} color="#6b1f2b" />
                <StatBar label="HP" value={heroStats.hp ?? 4200} max={5000} icon={Heart} color="#10B981" />
                <StatBar label="Mana" value={heroStats.mana ?? 380} max={500} icon={Zap} color="#a83246" />
              </div>

              <div className="mt-10 flex gap-4">
                {hero ? (
                  <Link to={`/e/${hero.id}`} data-testid="featured-learn-more" className="rune-btn">
                    Learn More <ArrowRight size={14} />
                  </Link>
                ) : (
                  <Link to="/c/characters/heroes" data-testid="featured-cta-browse" className="rune-btn">
                    Browse Heroes <ArrowRight size={14} />
                  </Link>
                )}
                <Link to="/c/characters/heroes" className="rune-btn ghost">
                  All Champions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VIDEO TUTORIALS */}
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className="ornate-rule mb-10">
          <span className="font-heading text-xs tracking-[0.4em] uppercase">Tome of Moving Pictures</span>
        </div>
        <div className="flex items-end justify-between mb-10">
          <h2 className="font-heading text-3xl sm:text-4xl text-slate-100">
            Recent <span className="text-arcane">Guides</span>
          </h2>
          <Link to="/c/tutorials/videos" data-testid="all-videos-link" className="text-xs tracking-[0.3em] uppercase text-slate-400 hover:text-[#D4AF37] flex items-center gap-2">
            All Videos <ArrowRight size={14} />
          </Link>
        </div>

        {videos.length === 0 ? (
          <RPGFrame className="p-12 text-center">
            <Video size={32} className="mx-auto text-[#a83246]/50 mb-4" />
            <p className="text-slate-400 text-sm">
              No video tutorials chronicled yet. The scribes are hard at work.
            </p>
          </RPGFrame>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((v) => (
              <VideoCard key={v.id} entry={v} />
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="px-6 md:px-12 lg:px-20 py-10 border-t border-[#D4AF37]/10 mt-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[10px] tracking-[0.4em] uppercase text-slate-600">
            ◆ Aethryl Codex · Chronicles of the Eternal Realm ◆
          </span>
          <span className="text-[10px] tracking-[0.3em] uppercase text-slate-600">
            Forged in the deep, bound in starlight.
          </span>
        </div>
      </footer>
    </div>
  );
}
