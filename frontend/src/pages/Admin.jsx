import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Plus, Edit3, Trash2, Upload, Star, Save, X } from "lucide-react";
import { api, mediaUrl } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import RPGFrame from "../components/RPGFrame";
import DataSourcesPanel from "../components/DataSourcesPanel";
import { CATEGORIES } from "../lib/categories";
import { toast } from "sonner";

const EMPTY = {
  category: "characters",
  subcategory: "heroes",
  title: "",
  description: "",
  image_url: "",
  youtube_url: "",
  duration: "",
  is_featured: false,
  stats: { attack: "", defense: "", hp: "", mana: "", speed: "", level: "", rarity: "" },
};

function Field({ label, children, testid }) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.3em] uppercase text-slate-400 mb-2">{label}</label>
      <div data-testid={testid}>{children}</div>
    </div>
  );
}

const inputCls = "w-full bg-[#0b0b10] border border-[#D4AF37]/25 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#a83246] focus:outline-none";

export default function Admin() {
  const { user, loading } = useAuth();
  const [params, setParams] = useSearchParams();
  const editId = params.get("edit");

  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterCat, setFilterCat] = useState("");

  const fetchEntries = useCallback(async () => {
    try {
      const res = await api.get("/entries", { params: filterCat ? { category: filterCat, limit: 500 } : { limit: 500 } });
      setEntries(res.data || []);
    } catch (e) { toast.error("Failed to load entries"); }
  }, [filterCat]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  useEffect(() => {
    if (editId && entries.length > 0) {
      const match = entries.find((e) => e.id === editId);
      if (match) startEdit(match);
    }
  }, [editId, entries]); // eslint-disable-line react-hooks/exhaustive-deps

  const catObj = CATEGORIES.find((c) => c.slug === form.category) || CATEGORIES[1];
  const subOptions = catObj?.children || [];

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setShowForm(true);
  };
  const startEdit = (entry) => {
    setEditingId(entry.id);
    setForm({
      ...EMPTY,
      ...entry,
      stats: { ...EMPTY.stats, ...(entry.stats || {}) },
    });
    setShowForm(true);
  };
  const cancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY);
    if (editId) { params.delete("edit"); setParams(params, { replace: true }); }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((f) => ({ ...f, image_url: res.data.url }));
      toast.success("Image ascended to storage.");
    } catch (e) {
      toast.error("Upload failed.");
    } finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error("Title is required."); return; }
    setSaving(true);
    try {
      const cleanStats = {};
      Object.entries(form.stats || {}).forEach(([k, v]) => {
        if (v === "" || v == null) return;
        if (k === "rarity") cleanStats[k] = String(v);
        else { const n = Number(v); if (!Number.isNaN(n)) cleanStats[k] = n; }
      });
      const payload = {
        category: form.category,
        subcategory: form.subcategory,
        title: form.title.trim(),
        description: form.description || "",
        image_url: form.image_url || null,
        youtube_url: form.youtube_url || null,
        duration: form.duration || null,
        is_featured: !!form.is_featured,
        stats: cleanStats,
      };
      if (editingId) {
        await api.put(`/entries/${editingId}`, payload);
        toast.success("Entry updated.");
      } else {
        await api.post("/entries", payload);
        toast.success("Entry inscribed.");
      }
      await fetchEntries();
      cancel();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Save failed");
    } finally { setSaving(false); }
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Banish this entry?")) return;
    try {
      await api.delete(`/entries/${id}`);
      toast.success("Banished.");
      fetchEntries();
    } catch (e) { toast.error("Delete failed."); }
  };

  if (loading) return <div className="p-12 text-slate-400">…</div>;
  if (!user) {
    return (
      <div className="p-12 text-center">
        <h1 className="font-heading text-3xl text-slate-100">Forbidden</h1>
        <p className="text-slate-400 mt-2">The sanctum is sealed. Sign in first.</p>
        <Link to="/login" className="rune-btn mt-6 inline-flex">Sign In</Link>
      </div>
    );
  }
  if (!user.is_admin) {
    return (
      <div className="p-12 text-center">
        <h1 className="font-heading text-3xl text-slate-100">Archon rank required</h1>
        <p className="text-slate-400 mt-2">Your sigil lacks the mark of the scribes.</p>
      </div>
    );
  }

  return (
    <div data-testid="admin-page" className="px-4 sm:px-6 md:px-12 lg:px-16 py-8 sm:py-10 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-[11px] tracking-[0.4em] uppercase text-[#a83246]">Archon Sanctum</span>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-slate-100 mt-2">Codex Scriptorium</h1>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">Inscribe, amend, or banish entries from the eternal record.</p>
        </div>
        <button onClick={startCreate} data-testid="admin-new-entry" className="rune-btn w-full sm:w-auto">
          <Plus size={14} /> New Entry
        </button>
      </div>

      {/* Filter */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className={`${inputCls} w-full sm:max-w-xs`}
          data-testid="admin-filter-cat"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
        </select>
        <span className="text-[11px] tracking-[0.3em] uppercase text-slate-500">{entries.length} entries</span>
      </div>

      {/* Form */}
      {showForm && (
        <RPGFrame className="p-6 mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl text-[#D4AF37]">
              {editingId ? "Amend Entry" : "Inscribe New Entry"}
            </h2>
            <button onClick={cancel} className="text-slate-400 hover:text-red-400"><X size={18} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Category" testid="field-category">
              <select
                className={inputCls}
                value={form.category}
                onChange={(e) => {
                  const newCat = e.target.value;
                  const c = CATEGORIES.find((x) => x.slug === newCat);
                  setForm({ ...form, category: newCat, subcategory: c?.children?.[0]?.slug || "" });
                }}
              >
                {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Subcategory" testid="field-subcategory">
              <select className={inputCls} value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })}>
                {subOptions.map((s) => <option key={s.slug} value={s.slug}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Title" testid="field-title">
              <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Kael of the Silver Vow" />
            </Field>
            <Field label="Rarity" testid="field-rarity">
              <select className={inputCls} value={form.stats.rarity || ""} onChange={(e) => setForm({ ...form, stats: { ...form.stats, rarity: e.target.value } })}>
                <option value="">—</option>
                {["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Description" testid="field-description">
                <textarea
                  rows={4}
                  className={inputCls}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Lore, backstory, mechanics…"
                />
              </Field>
            </div>

            {/* Image */}
            <div className="md:col-span-2">
              <Field label="Image" testid="field-image">
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      className={inputCls}
                      placeholder="Image URL or upload below"
                      value={form.image_url || ""}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    />
                    <label className="mt-2 flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-[#D4AF37] w-fit">
                      <Upload size={13} />
                      <span>{uploading ? "Ascending…" : "Upload from device"}</span>
                      <input
                        data-testid="upload-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleUpload(e.target.files?.[0])}
                      />
                    </label>
                  </div>
                  {form.image_url && (
                    <div className="w-24 h-24 border border-[#D4AF37]/30 overflow-hidden flex-shrink-0">
                      <img src={mediaUrl(form.image_url)} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </Field>
            </div>

            {/* YouTube */}
            <Field label="YouTube URL" testid="field-youtube">
              <input className={inputCls} value={form.youtube_url || ""} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} placeholder="https://youtu.be/…" />
            </Field>
            <Field label="Duration (for videos)" testid="field-duration">
              <input className={inputCls} value={form.duration || ""} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="12:34" />
            </Field>

            {/* Stats */}
            {["attack", "defense", "hp", "mana", "speed", "level"].map((k) => (
              <Field key={k} label={k} testid={`field-stat-${k}`}>
                <input
                  type="number"
                  className={inputCls}
                  value={form.stats[k] ?? ""}
                  onChange={(e) => setForm({ ...form, stats: { ...form.stats, [k]: e.target.value } })}
                />
              </Field>
            ))}

            <div className="md:col-span-2 flex items-center gap-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="field-featured"
                  checked={!!form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                  className="w-4 h-4 accent-[#D4AF37]"
                />
                <span className="text-sm text-slate-300 flex items-center gap-2">
                  <Star size={14} className="text-[#D4AF37]" /> Feature on homepage
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-[#D4AF37]/10">
            <button data-testid="admin-save-btn" onClick={save} disabled={saving} className="rune-btn w-full sm:w-auto">
              <Save size={14} /> {saving ? "Sealing…" : editingId ? "Seal Amendment" : "Inscribe"}
            </button>
            <button onClick={cancel} className="rune-btn ghost w-full sm:w-auto">Cancel</button>
          </div>
        </RPGFrame>
      )}

      {/* Entries table */}
      <RPGFrame className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#D4AF37]/20 text-[10px] tracking-[0.3em] uppercase text-slate-500">
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Sub</th>
                <th className="text-left px-4 py-3">Rarity</th>
                <th className="text-left px-4 py-3">Featured</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No entries yet.</td></tr>
              ) : entries.map((e) => (
                <tr key={e.id} className="border-b border-[#D4AF37]/5 hover:bg-[#a83246]/5">
                  <td className="px-4 py-3 font-heading text-slate-100">{e.title}</td>
                  <td className="px-4 py-3 text-slate-400">{e.category}</td>
                  <td className="px-4 py-3 text-slate-400">{e.subcategory}</td>
                  <td className="px-4 py-3 text-[#D4AF37]">{e.stats?.rarity || "—"}</td>
                  <td className="px-4 py-3">{e.is_featured ? <Star size={14} className="text-[#D4AF37]" /> : <span className="text-slate-600">—</span>}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/e/${e.id}`} className="text-slate-400 hover:text-[#D4AF37]" title="View"><Edit3 size={14} className="hidden" /></Link>
                      <button onClick={() => startEdit(e)} data-testid={`admin-edit-${e.id}`} className="text-slate-400 hover:text-[#D4AF37] p-1"><Edit3 size={14} /></button>
                      <button onClick={() => deleteEntry(e.id)} data-testid={`admin-delete-${e.id}`} className="text-slate-400 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RPGFrame>
    </div>
  );
}
