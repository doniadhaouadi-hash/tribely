// Category metadata and shared activity types. Real activity data comes
// from Supabase (see src/lib/activitiesApi.ts), not from this file.

export const CATEGORY_KEYS = [
  "running",
  "football",
  "gym",
  "yoga",
  "cycling",
  "walking",
  "tennis_padel",
  "basketball",
  "swimming",
  "climbing",
  "dance_fitness",
  "coffee",
  "social",
  "other",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export type SkillLevel = "casual" | "intermediate" | "committed" | "all";

export type CategoryMeta = {
  key: CategoryKey;
  label: string;
  emoji: string;
  /** Tailwind text color class for category tint (uses --cat-* tokens) */
  tintClass: string;
  /** HSL var name without var() wrapper, e.g. "--cat-running" */
  tintVar: string;
};

export const CATEGORIES: Record<CategoryKey, CategoryMeta> = {
  running:       { key: "running",       label: "Running",       emoji: "🏃", tintClass: "text-cat-running",    tintVar: "--cat-running" },
  football:      { key: "football",      label: "Football",      emoji: "⚽", tintClass: "text-cat-football",   tintVar: "--cat-football" },
  gym:           { key: "gym",           label: "Gym",           emoji: "💪", tintClass: "text-cat-gym",        tintVar: "--cat-gym" },
  yoga:          { key: "yoga",          label: "Yoga",          emoji: "🧘", tintClass: "text-cat-yoga",       tintVar: "--cat-yoga" },
  cycling:       { key: "cycling",       label: "Cycling",       emoji: "🚴", tintClass: "text-cat-cycling",    tintVar: "--cat-cycling" },
  walking:       { key: "walking",       label: "Walking",       emoji: "🥾", tintClass: "text-cat-walking",    tintVar: "--cat-walking" },
  tennis_padel:  { key: "tennis_padel",  label: "Tennis/Padel",  emoji: "🎾", tintClass: "text-cat-tennis",     tintVar: "--cat-tennis" },
  basketball:    { key: "basketball",    label: "Basketball",    emoji: "🏀", tintClass: "text-cat-basketball", tintVar: "--cat-basketball" },
  swimming:      { key: "swimming",      label: "Swimming",      emoji: "🏊", tintClass: "text-cat-swimming",   tintVar: "--cat-swimming" },
  climbing:      { key: "climbing",      label: "Climbing",      emoji: "🧗", tintClass: "text-cat-climbing",   tintVar: "--cat-climbing" },
  dance_fitness: { key: "dance_fitness", label: "Dance/Fitness", emoji: "🕺", tintClass: "text-cat-dance",      tintVar: "--cat-dance" },
  coffee:        { key: "coffee",        label: "Coffee",        emoji: "☕", tintClass: "text-cat-coffee",     tintVar: "--cat-coffee" },
  social:        { key: "social",        label: "Socializing",   emoji: "🎉", tintClass: "text-cat-social",     tintVar: "--cat-social" },
  other:         { key: "other",         label: "Other",         emoji: "✨", tintClass: "text-cat-other",      tintVar: "--cat-other" },
};

export type MockActivity = {
  id: string;
  title: string;
  description: string;
  category: CategoryKey;
  lat: number;
  lng: number;
  address: string;
  city: string;
  startsAt: string; // ISO
  durationMinutes: number;
  capacity: number;
  joined: number;
  skillLevel: SkillLevel;
  spontaneous: boolean;
  coverUrl: string | null;
  host: {
    id: string;
    displayName: string;
    avatarSeed: string;
    avatarUrl: string | null;
    rating: number;
  };
};
