import React, { useEffect, useState, useCallback } from "react";
import { Upload, Database, FileJson, RefreshCw, Save } from "lucide-react";
import { api } from "../lib/api";
import RPGFrame from "./RPGFrame";
import { toast } from "sonner";

const COMMON_SOURCES = ["items", "characters", "craft", "monuments", "soldiers", "heroes", "news"];

export default function DataSourcesPanel() {
  const [sources, setSources] = useState([]);
  const [name, setName] = useState("items");
  const [customName, setCustomName] = useState("");
  const [mode, setMode] = useState("overwrite");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/data");
      setSources(res.data?.sources || []);
    } catch (e) {
      setSources([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const effectiveName = (name === "__custom__" ? customName.trim() : name).toLowerCase();

  const handleImport = async () => {
    if (!effectiveName || !/^[a-z0-9_-]+$/.test(effectiveName)) {
      toast.error("Provide a valid data-source name (a-z, 0-9, _-).");
      return;
    }
    if (!file) { toast.error("Select a JSON file to import."); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.put(`/data/${effectiveName}?mode=${mode}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const merged = res.data?.merged;
      if (mode === "merge" && merged) {
        toast.success(
          `Merged into ${effectiveName}.json — +${merged.appended_rows || 0} rows` +
          (merged.added_keys ? `, +${merged.added_keys} new keys` : "")
        );
      } else {
        toast.success(`${effectiveName}.json ${mode === "merge" ? "merged" : "replaced"} (${(res.data.size / 1024).toFixed(1)} KB).`);
      }
      setFile(null);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Import failed");
    } finally { setUploading(false); }
  };

  return (
    <RPGFrame className="p-6 mb-10">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h2 className="font-heading text-2xl text-[#D4AF37] flex items-center gap-2">
            <Database size={20} /> Data Sources
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Upload a JSON file to power any codex section. Overwrite the file entirely, or merge new entries into existing data. Fields are read dynamically — missing fields are ignored.
          </p>
        </div>
        <button
          onClick={load}
          data-testid="data-sources-refresh"
          className="text-slate-400 hover:text-[#D4AF37] flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase"
          disabled={loading}
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Existing sources */}
      <div className="mb-6">
        <div className="text-[10px] tracking-[0.4em] uppercase text-slate-500 mb-2">Mounted</div>
        <div className="flex flex-wrap gap-2">
          {sources.length === 0 && !loading && (
            <span className="text-xs text-slate-600 italic">No data files yet.</span>
          )}
          {sources.map((s) => (
            <span
              key={s.name}
              data-testid={`data-source-${s.name}`}
              className="inline-flex items-center gap-2 text-xs px-3 py-1.5 border border-[#D4AF37]/30 bg-[#14090d] text-slate-300"
            >
              <FileJson size={12} className="text-[#a83246]" />
              <span className="font-mono">{s.name}</span>
              <span className="text-slate-500">· {(s.size / 1024).toFixed(1)} KB</span>
            </span>
          ))}
        </div>
      </div>

      {/* Import form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] tracking-[0.3em] uppercase text-slate-400 mb-2">
            Data Source
          </label>
          <select
            data-testid="json-import-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#0b0b10] border border-[#D4AF37]/25 px-3 py-2 text-sm text-slate-100 focus:border-[#a83246] focus:outline-none"
          >
            {COMMON_SOURCES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
            <option value="__custom__">— Custom name —</option>
          </select>
          {name === "__custom__" && (
            <input
              data-testid="json-import-custom-name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="my_data"
              className="mt-2 w-full bg-[#0b0b10] border border-[#D4AF37]/25 px-3 py-2 text-sm font-mono text-slate-100 focus:border-[#a83246] focus:outline-none"
            />
          )}
        </div>

        <div>
          <label className="block text-[10px] tracking-[0.3em] uppercase text-slate-400 mb-2">Mode</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "overwrite", label: "Overwrite" },
              { id: "merge", label: "Merge" },
            ].map((m) => (
              <button
                key={m.id}
                data-testid={`json-import-mode-${m.id}`}
                onClick={() => setMode(m.id)}
                className={`text-xs tracking-[0.2em] uppercase py-2 border transition-all ${
                  mode === m.id
                    ? "bg-[#a83246] border-[#D4AF37] text-white shadow-[0_0_10px_rgba(168,50,70,0.5)]"
                    : "bg-[#0b0b10] border-[#D4AF37]/25 text-slate-400 hover:border-[#a83246]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
            {mode === "merge"
              ? "Concatenates arrays and merges objects per top-level key."
              : "Replaces the file entirely."}
          </p>
        </div>

        <div>
          <label className="block text-[10px] tracking-[0.3em] uppercase text-slate-400 mb-2">JSON File</label>
          <label className="flex flex-col gap-2 w-full bg-[#0b0b10] border border-[#D4AF37]/25 px-3 py-2 cursor-pointer hover:border-[#a83246]">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Upload size={14} className="text-[#D4AF37]" />
              <span className="truncate">{file ? file.name : "Choose .json"}</span>
            </div>
            {file && (
              <span className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
            )}
            <input
              data-testid="json-import-file"
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6 pt-5 border-t border-[#D4AF37]/10">
        <button
          data-testid="json-import-submit"
          onClick={handleImport}
          disabled={uploading || !file}
          className="rune-btn"
        >
          <Save size={14} /> {uploading ? "Importing…" : `Import as ${effectiveName || "…"}`}
        </button>
        <span className="text-[10px] tracking-[0.3em] uppercase text-slate-500">
          Changes are live immediately
        </span>
      </div>
    </RPGFrame>
  );
}
