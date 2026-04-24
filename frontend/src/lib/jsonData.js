import { useEffect, useState } from "react";
import { api } from "./api";

// Simple in-memory cache — fetches only once per page load.
const cache = new Map();
const inflight = new Map();

export function useJsonData(name) {
  const [data, setData] = useState(() => cache.get(name) ?? null);
  const [loading, setLoading] = useState(!cache.has(name));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!name) return;
    if (cache.has(name)) { setData(cache.get(name)); setLoading(false); return; }

    let cancelled = false;
    const existing = inflight.get(name);
    const promise = existing || api.get(`/data/${name}`).then((r) => r.data);
    if (!existing) inflight.set(name, promise);

    setLoading(true);
    promise
      .then((d) => {
        if (cancelled) return;
        cache.set(name, d);
        setData(d);
      })
      .catch((e) => { if (!cancelled) setError(e); })
      .finally(() => {
        if (!cancelled) setLoading(false);
        inflight.delete(name);
      });

    return () => { cancelled = true; };
  }, [name]);

  return { data, loading, error };
}
