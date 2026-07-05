// Mock data for Phase 2. Will be replaced by Supabase queries in Phase 4.
// All activities live in Frankfurt am Main.

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
  host: { id: string; displayName: string; avatarSeed: string; rating: number };
};

// Build dates relative to "now" so the feed always feels fresh.
const now = new Date();
const inHours = (h: number) => new Date(now.getTime() + h * 3600 * 1000).toISOString();
const inDays  = (d: number, hour = 18, minute = 0) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() + d);
  dt.setHours(hour, minute, 0, 0);
  return dt.toISOString();
};

export const MOCK_ACTIVITIES: MockActivity[] = [
  {
    id: "act-001",
    title: "Morning Run am Main",
    description: "Easy 5K along the river. Coffee after at the kiosk ☕",
    category: "running",
    lat: 50.1086, lng: 8.6747,
    address: "Eiserner Steg, Frankfurt",
    city: "Frankfurt",
    startsAt: inDays(1, 7, 0),
    durationMinutes: 45,
    capacity: 8, joined: 3,
    skillLevel: "casual",
    spontaneous: false,
    host: { id: "u-1", displayName: "Lena K.", avatarSeed: "lena-k", rating: 4.8 },
  },
  {
    id: "act-002",
    title: "Pickup Football – Hauptfeld",
    description: "Casual 5v5 on grass. Bring a light & dark shirt.",
    category: "football",
    lat: 50.1004, lng: 8.6534,
    address: "Niederräder Ufer, Frankfurt",
    city: "Frankfurt",
    startsAt: inDays(0, 18, 30),
    durationMinutes: 90,
    capacity: 12, joined: 9,
    skillLevel: "all",
    spontaneous: false,
    host: { id: "u-2", displayName: "Marco D.", avatarSeed: "marco-d", rating: 4.6 },
  },
  {
    id: "act-003",
    title: "Spontaneous Basketball – Ostpark",
    description: "Need 2 more for full court. Show up if you're around!",
    category: "basketball",
    lat: 50.1153, lng: 8.7152,
    address: "Ostpark Court, Frankfurt",
    city: "Frankfurt",
    startsAt: inHours(2),
    durationMinutes: 60,
    capacity: 10, joined: 6,
    skillLevel: "intermediate",
    spontaneous: true,
    host: { id: "u-3", displayName: "Jules M.", avatarSeed: "jules-m", rating: 4.9 },
  },
  {
    id: "act-004",
    title: "Sunrise Yoga – Grüneburgpark",
    description: "Gentle vinyasa flow. Mats welcome, towels fine too.",
    category: "yoga",
    lat: 50.1245, lng: 8.6651,
    address: "Grüneburgpark, Frankfurt",
    city: "Frankfurt",
    startsAt: inDays(2, 8, 0),
    durationMinutes: 60,
    capacity: 15, joined: 7,
    skillLevel: "all",
    spontaneous: false,
    host: { id: "u-4", displayName: "Aria S.", avatarSeed: "aria-s", rating: 4.95 },
  },
  {
    id: "act-005",
    title: "Climbing Session – DAV Halle",
    description: "Top-rope & lead. Beginners welcome, partners pair up onsite.",
    category: "climbing",
    lat: 50.0936, lng: 8.6422,
    address: "DAV Kletterzentrum, Frankfurt",
    city: "Frankfurt",
    startsAt: inDays(3, 19, 0),
    durationMinutes: 120,
    capacity: 8, joined: 4,
    skillLevel: "intermediate",
    spontaneous: false,
    host: { id: "u-5", displayName: "Tomás R.", avatarSeed: "tomas-r", rating: 4.7 },
  },
  {
    id: "act-006",
    title: "Tennis Match – Eintracht Plätze",
    description: "Doubles. Mid-level rallies, friendly scoring.",
    category: "tennis_padel",
    lat: 50.0682, lng: 8.6453,
    address: "Eintracht Tennisanlage, Frankfurt",
    city: "Frankfurt",
    startsAt: inDays(4, 19, 30),
    durationMinutes: 90,
    capacity: 4, joined: 2,
    skillLevel: "intermediate",
    spontaneous: false,
    host: { id: "u-6", displayName: "Priya N.", avatarSeed: "priya-n", rating: 4.85 },
  },
  {
    id: "act-007",
    title: "Cycling – Taunus Loop",
    description: "65 km, ~4h, rolling hills. Bring snacks + spare tube.",
    category: "cycling",
    lat: 50.1421, lng: 8.6234,
    address: "Start: Alte Oper, Frankfurt",
    city: "Frankfurt",
    startsAt: inDays(5, 9, 0),
    durationMinutes: 240,
    capacity: 12, joined: 5,
    skillLevel: "committed",
    spontaneous: false,
    host: { id: "u-7", displayName: "Kai B.", avatarSeed: "kai-b", rating: 4.75 },
  },
  {
    id: "act-008",
    title: "Lap Swim – Rebstockbad",
    description: "Steady freestyle laps. 30 min warm-up + sets.",
    category: "swimming",
    lat: 50.1167, lng: 8.6045,
    address: "Rebstockbad, Frankfurt",
    city: "Frankfurt",
    startsAt: inDays(2, 18, 0),
    durationMinutes: 60,
    capacity: 6, joined: 3,
    skillLevel: "intermediate",
    spontaneous: false,
    host: { id: "u-8", displayName: "Mei L.", avatarSeed: "mei-l", rating: 4.6 },
  },
  {
    id: "act-009",
    title: "Push-Pull at JMG Gym",
    description: "Bro split, friendly spotters. PRs encouraged 🔥",
    category: "gym",
    lat: 50.1133, lng: 8.6789,
    address: "John Reed Sachsenhausen",
    city: "Frankfurt",
    startsAt: inDays(1, 18, 0),
    durationMinutes: 90,
    capacity: 4, joined: 2,
    skillLevel: "committed",
    spontaneous: false,
    host: { id: "u-9", displayName: "Noah F.", avatarSeed: "noah-f", rating: 4.5 },
  },
  {
    id: "act-010",
    title: "Sunset Walk – Lohrberg",
    description: "Easy hike up the hill, vineyards & skyline view.",
    category: "walking",
    lat: 50.1597, lng: 8.7521,
    address: "Lohrberg, Frankfurt",
    city: "Frankfurt",
    startsAt: inDays(3, 17, 30),
    durationMinutes: 120,
    capacity: 20, joined: 11,
    skillLevel: "casual",
    spontaneous: false,
    host: { id: "u-10", displayName: "Sofia G.", avatarSeed: "sofia-g", rating: 4.9 },
  },
  {
    id: "act-011",
    title: "Hip-Hop Dance Class",
    description: "Beginner-friendly choreo. 60 min, all moves taught.",
    category: "dance_fitness",
    lat: 50.1147, lng: 8.6824,
    address: "Studio Move, Innenstadt",
    city: "Frankfurt",
    startsAt: inDays(4, 19, 0),
    durationMinutes: 60,
    capacity: 16, joined: 12,
    skillLevel: "casual",
    spontaneous: false,
    host: { id: "u-11", displayName: "Zoe T.", avatarSeed: "zoe-t", rating: 4.8 },
  },
  {
    id: "act-012",
    title: "Sunday Slackline Jam",
    description: "Bring a line if you have one — or just come hang.",
    category: "other",
    lat: 50.1168, lng: 8.6678,
    address: "Bockenheimer Anlage",
    city: "Frankfurt",
    startsAt: inDays(6, 14, 0),
    durationMinutes: 180,
    capacity: 15, joined: 4,
    skillLevel: "all",
    spontaneous: false,
    host: { id: "u-12", displayName: "Eli H.", avatarSeed: "eli-h", rating: 4.7 },
  },
];

export const dicebearAvatar = (seed: string) =>
  `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;
