// Central registry of categories → subcategories for sidebar and routing.
import {
  BookOpen, Users, Hammer, Swords, Orbit,
  Video, Shield, Trophy, TrendingUp, Dice5, Sparkles,
  Shirt, Gem, Flame, Sigma
} from "lucide-react";

export const CATEGORIES = [
  {
    slug: "tutorials",
    label: "Tutorials",
    icon: BookOpen,
    blurb: "Master every mechanic through video guides.",
    children: [
      { slug: "videos", label: "Videos", icon: Video },
    ],
  },
  {
    slug: "characters",
    label: "Characters",
    icon: Users,
    blurb: "Legendary heroes, soldiers, and monuments.",
    children: [
      { slug: "heroes", label: "Heroes", icon: Trophy },
      { slug: "soldiers", label: "Soldiers", icon: Shield },
      { slug: "monument", label: "Monument", icon: Sigma },
    ],
  },
  {
    slug: "craft",
    label: "Craft Systems",
    icon: Hammer,
    blurb: "Upgrade, craft and roll rare artifacts.",
    children: [
      { slug: "upgrade", label: "Upgrade", icon: TrendingUp },
      { slug: "crafting", label: "Crafting", icon: Hammer },
      { slug: "roll-items", label: "Roll Items", icon: Dice5 },
    ],
  },
  {
    slug: "items",
    label: "Items",
    icon: Swords,
    blurb: "Weapons, armors, accessories, skins & materials.",
    children: [
      { slug: "weapons", label: "Weapons", icon: Swords },
      { slug: "armors", label: "Armors", icon: Shield },
      { slug: "accessories", label: "Accessories", icon: Gem },
      { slug: "skins", label: "Skins", icon: Shirt },
      { slug: "materials", label: "Upgrade Materials", icon: Flame },
    ],
  },
  {
    slug: "orbs",
    label: "Orbs Stone",
    icon: Orbit,
    blurb: "Mystical orbs of the cosmos.",
    children: [
      { slug: "cosmos", label: "Orb of Cosmos", icon: Sparkles },
    ],
  },
];

export const HERO_CATEGORY_CARDS = CATEGORIES.filter(c => c.slug !== "orbs");

export function findCategory(slug) {
  return CATEGORIES.find(c => c.slug === slug);
}

export function findSub(categorySlug, subSlug) {
  const c = findCategory(categorySlug);
  return c?.children.find(s => s.slug === subSlug);
}

export function allSubs() {
  const out = [];
  CATEGORIES.forEach(c => c.children.forEach(s => out.push({ category: c.slug, sub: s.slug, label: s.label, parent: c.label })));
  return out;
}
