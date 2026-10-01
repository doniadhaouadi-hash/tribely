import type { CategoryKey, MockActivity } from "@/data/activities";
import type { DiscoverFilters } from "@/components/FilterSheet";
import { FEED_GRACE_MS } from "@/lib/activitiesApi";
import { distanceKm } from "@/lib/distance";
import { timeWindowEnd } from "@/lib/timeWindow";

export type DiscoverQuery = {
  category: CategoryKey | "all";
  query: string;
  filters: DiscoverFilters;
  /** Reference point for the "nearest" sort (the selected city). */
  origin: { lat: number; lng: number };
  now?: Date;
};

/** Filters and sorts the Discover feed (category, search, level, vibe, time window, sort). */
export const filterDiscoverActivities = (
  activities: MockActivity[],
  { category, query, filters, origin, now = new Date() }: DiscoverQuery,
): MockActivity[] => {
  const q = query.trim().toLowerCase();
  const nowMs = now.getTime();
  const cutoffMs = timeWindowEnd(filters.when, now);

  const list = activities
    .filter((a) => (category === "all" ? true : a.category === category))
    .filter((a) =>
      q.length === 0
        ? true
        : a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.address.toLowerCase().includes(q),
    )
    .filter((a) => (filters.level === "any" ? true : a.skillLevel === filters.level))
    .filter((a) => (filters.spontaneousOnly ? a.spontaneous : true))
    .filter((a) => {
      const t = new Date(a.startsAt).getTime();
      return t >= nowMs - FEED_GRACE_MS && t <= cutoffMs;
    });

  if (filters.sort === "nearest") {
    return list
      .map((a) => ({ a, d: distanceKm(origin.lat, origin.lng, a.lat, a.lng) }))
      .sort((x, y) => x.d - y.d)
      .map((x) => x.a);
  }
  if (filters.sort === "popular") {
    return [...list].sort((a, b) => b.joined - a.joined);
  }
  return [...list].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
};
