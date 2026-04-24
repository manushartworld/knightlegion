// Utilities for working with the dynamic items.json data.
// Data-driven — the UI walks whatever keys are present.

// Rarity system
export const GRADE_ORDER = ["Unique", "High", "Middle", "Low"];
// Lower rank = higher rarity (used for sorting)
export const GRADE_RANK = {
  Unique: 0,
  High: 1,
  Middle: 2,
  Low: 3,
};

// Tailwind classes for rarity badges + text
export const GRADE_STYLES = {
  Unique:  "text-[#D4AF37] border-[#D4AF37]/80 bg-[#D4AF37]/10",
  High:    "text-sky-300 border-sky-500/60 bg-sky-500/10",
  Middle:  "text-emerald-300 border-emerald-500/60 bg-emerald-500/10",
  Low:     "text-slate-300 border-slate-500/50 bg-slate-500/10",
  default: "text-slate-400 border-slate-600/40",
};

// Pure color tokens (used for icon tiles, glows, names)
export const GRADE_TOKENS = {
  Unique: { fg: "#f5e6a3", border: "rgba(212,175,55,0.85)", glow: "rgba(212,175,55,0.45)", name: "text-[#D4AF37]" },
  High:   { fg: "#7dd3fc", border: "rgba(56,189,248,0.75)", glow: "rgba(56,189,248,0.35)", name: "text-sky-300" },
  Middle: { fg: "#6ee7b7", border: "rgba(52,211,153,0.75)", glow: "rgba(52,211,153,0.3)",  name: "text-emerald-300" },
  Low:    { fg: "#cbd5e1", border: "rgba(148,163,184,0.6)", glow: "rgba(148,163,184,0.2)", name: "text-slate-300" },
  default: { fg: "#cbd5e1", border: "rgba(148,163,184,0.5)", glow: "rgba(148,163,184,0.2)", name: "text-slate-400" },
};

export function rarityTokens(grade) {
  return GRADE_TOKENS[grade] || GRADE_TOKENS.default;
}

// Maps Items sidebar subcategories to JSON top-level keys.
export const ITEMS_SUB_TO_KEYS = {
  weapons: ["weaponItems"],
  armors: ["armorItems", "shieldItems"],
  accessories: ["WebAccessoriesEnchants"],
  skins: ["skinItems"],
  materials: ["generalItems"],
};

// Returns an array of "groups" — each group is { base, items: [upgrade tiers] }
// Supports:
//   A) current schema: group = { items: [tier0, tier1, ...] }
//   B) future schema: item = { ...baseStats, upgrades: { "0": {...}, "1": {...}, ... } }
//   C) flat arrays: each item becomes its own 1-entry group
export function flattenToGroups(json, keys) {
  if (!json) return [];
  const groups = [];
  for (const key of keys) {
    const arr = json[key];
    if (!Array.isArray(arr)) continue;
    for (const g of arr) {
      if (!g || typeof g !== "object") continue;

      if (Array.isArray(g.items) && g.items.length > 0) {
        // Schema A: base = highest enchant (last tier)
        const base = g.items[g.items.length - 1];
        groups.push({ sourceKey: key, base, items: g.items });
      } else if (g.upgrades && typeof g.upgrades === "object") {
        // Schema B: upgrades dict
        const levels = Object.keys(g.upgrades)
          .map((k) => parseInt(k, 10))
          .filter((n) => !Number.isNaN(n))
          .sort((a, b) => a - b);
        const items = levels.map((lvl) => ({ ...g, ...g.upgrades[String(lvl)] }));
        const base = items[items.length - 1] || g;
        groups.push({ sourceKey: key, base, items });
      } else {
        // Schema C: flat
        groups.push({ sourceKey: key, base: g, items: [g] });
      }
    }
  }
  return groups;
}

// Global rarity sort — Unique > High > Middle > Low > (others), then by name asc.
export function sortGroups(groups) {
  return [...groups].sort((a, b) => {
    const ra = GRADE_RANK[a.base.itemGrade] ?? 99;
    const rb = GRADE_RANK[b.base.itemGrade] ?? 99;
    if (ra !== rb) return ra - rb;
    const na = (a.base.itemName || "").toLowerCase();
    const nb = (b.base.itemName || "").toLowerCase();
    return na.localeCompare(nb);
  });
}

// Label map — includes typo correction in the source data (intelliengce).
const LABEL_FIX = {
  itemName: "Name",
  iconName: "Icon",
  itemGrade: "Grade",
  attackPower: "Attack Power",
  castingRange: "Casting Range",
  castingSpeed: "Casting Speed",
  hpBonus: "HP",
  mpBonus: "MP",
  physicalDefense: "Physical Defense",
  arrowDefense: "Arrow Defense",
  magicDefense: "Magic Defense",
  strengthPointBonus: "STR",
  healthPointBonus: "HEALTH",
  dexterityPointBonus: "DEX",
  magicPointBonus: "MAGIC",
  intelliengcePointBonus: "INT",
  hand: "Hand",
  type: "Type",
  permitted: "Permitted Class",
  comment_en: "Description (EN)",
  comment_tr: "Description (TR)",
};

export function prettyLabel(key) {
  if (LABEL_FIX[key]) return LABEL_FIX[key];
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Fields never shown to the user.
export const HIDDEN_KEYS = new Set(["iconName", "upgrades"]);

// Identity keys (shown in the header, not in the stat table).
export const IDENTITY_KEYS = new Set(["itemName", "itemGrade", "type", "hand", "permitted"]);

// Primary numeric stats to surface in card summary.
export const PRIMARY_STATS = [
  "attackPower",
  "physicalDefense",
  "arrowDefense",
  "magicDefense",
  "hpBonus",
  "mpBonus",
];

export function isMeaningful(v) {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return v !== 0;
  return true;
}

// All display-worthy keys (modal table).
export function allFields(obj) {
  return Object.keys(obj).filter((k) => !HIDDEN_KEYS.has(k));
}

// Stat keys (everything except identity + hidden) — for the single-column stat table.
export function statFields(obj) {
  return Object.keys(obj).filter((k) => !HIDDEN_KEYS.has(k) && !IDENTITY_KEYS.has(k));
}
