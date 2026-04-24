// Utilities for working with the dynamic items.json data.
// The schema uses an array of groups (objects containing `items`) for most
// categories, and flat arrays for general items. We stay fully data-driven:
// the UI simply walks whatever keys are present.

export const GRADE_ORDER = ["Low", "Middle", "High", "Unique", "Legendary", "Mythic"];

export const GRADE_STYLES = {
  Low: "text-slate-300 border-slate-500/40 bg-slate-500/5",
  Middle: "text-amber-300 border-amber-500/40 bg-amber-500/5",
  High: "text-emerald-300 border-emerald-500/40 bg-emerald-500/5",
  Unique: "text-[#D4AF37] border-[#D4AF37]/70 bg-[#D4AF37]/5",
  Legendary: "text-[#a83246] border-[#a83246]/70 bg-[#a83246]/10",
  Mythic: "text-rose-300 border-rose-500/60 bg-rose-500/10",
  default: "text-slate-400 border-slate-600/40",
};

// Maps Items sidebar subcategories to JSON top-level keys.
export const ITEMS_SUB_TO_KEYS = {
  weapons: ["weaponItems"],
  armors: ["armorItems", "shieldItems"],
  accessories: ["WebAccessoriesEnchants"],
  skins: ["skinItems"],
  materials: ["generalItems"],
};

// Returns an array of "groups" — each group is { baseItem, items: [...enchants] }
// For flat arrays (generalItems), each item becomes its own 1-entry group.
export function flattenToGroups(json, keys) {
  if (!json) return [];
  const groups = [];
  for (const key of keys) {
    const arr = json[key];
    if (!Array.isArray(arr)) continue;
    for (const g of arr) {
      if (g && Array.isArray(g.items)) {
        if (g.items.length === 0) continue;
        // Represent by highest enchant (last item).
        const base = g.items[g.items.length - 1];
        groups.push({ sourceKey: key, base, items: g.items });
      } else if (g && typeof g === "object") {
        groups.push({ sourceKey: key, base: g, items: [g] });
      }
    }
  }
  return groups;
}

// Attempt to pull out a "type" for filtering (Axe, Sword, Bow, ...).
export function getType(base) {
  return base?.type || base?.hand || base?.itemGrade || "Other";
}

export function getGrade(base) {
  return base?.itemGrade || "";
}

// Turn camelCase/PascalCase field names into readable labels.
// Also corrects a typo in the source dataset.
const LABEL_FIX = {
  intelliengcePointBonus: "Intelligence Point Bonus",
  mpBonus: "MP Bonus",
  hpBonus: "HP Bonus",
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

// Hide or always-show semantics.
export const HIDDEN_KEYS = new Set(["iconName"]);

// Primary numeric stats to surface in card summary.
export const PRIMARY_STATS = [
  "attackPower",
  "physicalDefense",
  "arrowDefense",
  "magicDefense",
  "hpBonus",
  "mpBonus",
];

// Decide if a field value is "meaningful" (non-zero, non-empty) for card summary.
export function isMeaningful(v) {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return v !== 0;
  return true;
}

// All display-worthy keys for the modal (show every field from JSON, including zeros).
export function allFields(obj) {
  return Object.keys(obj).filter((k) => !HIDDEN_KEYS.has(k));
}
