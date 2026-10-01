import { CATEGORIES, type CategoryKey } from "@/data/activities";

/** Tribely-themed emojis shown when someone has no photo and no listed sport. */
const FALLBACK_EMOJIS = ["🏃", "⚽", "💪", "🧘", "🚴", "🥾", "🎾", "🏀", "🏊", "🧗", "🕺", "✨"];

const hashSeed = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
};

/** Picks a sport-themed emoji: a person's first listed sport, else a stable pick by seed. */
export const pickAvatarEmoji = (seed: string, sports?: string[] | null) => {
  const firstSport = sports?.[0] as CategoryKey | undefined;
  if (firstSport && firstSport in CATEGORIES) return CATEGORIES[firstSport].emoji;
  return FALLBACK_EMOJIS[hashSeed(seed) % FALLBACK_EMOJIS.length];
};
