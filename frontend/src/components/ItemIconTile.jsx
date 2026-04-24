import React, { useState, useEffect } from "react";
import { Swords, Shield, Shirt, Gem, Flame, Sparkles, CircleHelp, Package } from "lucide-react";
import { rarityTokens, buildIconUrl } from "../lib/itemsHelpers";

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

const SIZE_PX = { xs: 40, sm: 56, md: 80, lg: 120 };
const ICON_PX = { xs: 20, sm: 26, md: 34, lg: 52 };

export default function ItemIconTile({ item, size = "md" }) {
  const iconUrl = buildIconUrl(item?.iconName);
  const [imgError, setImgError] = useState(false);

  // Reset error state if iconName changes
  useEffect(() => { setImgError(false); }, [iconUrl]);

  const Icon = pickIcon(item?.itemName, item?.iconName, item?.type);
  const t = rarityTokens(item?.itemGrade);

  const px = SIZE_PX[size] ?? SIZE_PX.md;
  const iconSize = ICON_PX[size] ?? ICON_PX.md;
  const showImage = iconUrl && !imgError;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{
        width: px,
        height: px,
        background: `radial-gradient(circle at 30% 20%, ${t.glow}, transparent 70%), #0b0b10`,
        border: `1px solid ${t.border}`,
        boxShadow: `inset 0 0 20px rgba(0,0,0,0.7), 0 0 10px ${t.glow}`,
      }}
      aria-hidden
    >
      <span className="absolute top-0 left-0 w-2 h-2 border-t border-l" style={{ borderColor: t.border }} />
      <span className="absolute top-0 right-0 w-2 h-2 border-t border-r" style={{ borderColor: t.border }} />
      <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l" style={{ borderColor: t.border }} />
      <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r" style={{ borderColor: t.border }} />
      {showImage ? (
        <img
          src={iconUrl}
          alt=""
          onError={() => setImgError(true)}
          onLoad={(e) => {
            // Dev server returns 200 + HTML for missing files. Detect that: broken images
            // have naturalWidth === 0.
            if (!e.currentTarget.naturalWidth) setImgError(true);
          }}
          className="relative z-10 max-w-[82%] max-h-[82%] object-contain"
          draggable={false}
        />
      ) : (
        <Icon size={iconSize} style={{ color: t.fg, position: "relative", zIndex: 10 }} />
      )}
    </div>
  );
}
