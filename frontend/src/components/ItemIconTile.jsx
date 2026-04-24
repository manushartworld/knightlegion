import React from "react";
import { Swords, Shield, Shirt, Gem, Flame, Sparkles, CircleHelp, Package } from "lucide-react";

// Maps type/keyword → lucide icon. Deterministic stylised tile so each item is recognisable
// without external icon artwork.
const TYPE_ICON = [
  { match: /axe|sword|club|mace|spear|bow|dagger|staff|lancer|talon|weapon/i, icon: Swords },
  { match: /shield/i, icon: Shield },
  { match: /helm|pauldron|pads|boots|gauntlet|armor|cape/i, icon: Shirt },
  { match: /ring|amulet|necklace|accessor/i, icon: Gem },
  { match: /elixir|potion|buff|essence|dew|mind|flow|spark|radiance/i, icon: Flame },
  { match: /recipe|ingot|gold|material/i, icon: Package },
  { match: /skin/i, icon: Sparkles },
];

function pickIcon(name = "", iconName = "", type = "") {
  const hay = `${name} ${iconName} ${type}`;
  for (const { match, icon } of TYPE_ICON) {
    if (match.test(hay)) return icon;
  }
  return CircleHelp;
}

const GRADE_TINT = {
  Low: { border: "rgba(148,163,184,0.5)", glow: "rgba(148,163,184,0.25)", fg: "#cbd5e1" },
  Middle: { border: "rgba(251,191,36,0.6)", glow: "rgba(251,191,36,0.3)", fg: "#fcd34d" },
  High: { border: "rgba(52,211,153,0.65)", glow: "rgba(52,211,153,0.3)", fg: "#6ee7b7" },
  Unique: { border: "rgba(212,175,55,0.8)", glow: "rgba(212,175,55,0.35)", fg: "#f5e6a3" },
  Legendary: { border: "rgba(168,50,70,0.85)", glow: "rgba(168,50,70,0.45)", fg: "#f9a8b5" },
  Mythic: { border: "rgba(244,63,94,0.85)", glow: "rgba(244,63,94,0.45)", fg: "#fecdd3" },
};

export default function ItemIconTile({ item, size = "md" }) {
  const Icon = pickIcon(item?.itemName, item?.iconName, item?.type);
  const grade = item?.itemGrade || "Low";
  const tint = GRADE_TINT[grade] || GRADE_TINT.Low;

  const px = size === "sm" ? 48 : size === "lg" ? 120 : 80;
  const iconSize = size === "sm" ? 22 : size === "lg" ? 52 : 34;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{
        width: px,
        height: px,
        background: `radial-gradient(circle at 30% 20%, ${tint.glow}, transparent 70%), #0b0b10`,
        border: `1px solid ${tint.border}`,
        boxShadow: `inset 0 0 20px rgba(0,0,0,0.7), 0 0 10px ${tint.glow}`,
      }}
      aria-hidden
    >
      {/* corner notches */}
      <span className="absolute top-0 left-0 w-2 h-2 border-t border-l" style={{ borderColor: tint.border }} />
      <span className="absolute top-0 right-0 w-2 h-2 border-t border-r" style={{ borderColor: tint.border }} />
      <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l" style={{ borderColor: tint.border }} />
      <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r" style={{ borderColor: tint.border }} />
      <Icon size={iconSize} style={{ color: tint.fg }} />
    </div>
  );
}
