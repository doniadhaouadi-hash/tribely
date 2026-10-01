import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { DEFAULT_FILTERS } from "@/components/FilterSheet";
import { filterDiscoverActivities, type DiscoverQuery } from "@/lib/discoverFilter";
import { makeActivity } from "@/test/fixtures";

const now = new Date(2026, 9, 1, 12, 0); // 1 Oct 2026, 12:00 local
const at = (h: number, day = 1) => new Date(2026, 9, day, h, 0).toISOString();

const base: DiscoverQuery = {
  category: "all",
  query: "",
  filters: DEFAULT_FILTERS,
  origin: { lat: 50.1109, lng: 8.6821 },
  now,
};

const ids = (list: { id: string }[]) => list.map((a) => a.id);

describe("filterDiscoverActivities", () => {
  const run = makeActivity({ id: "run", startsAt: at(18), joined: 2 });
  const yoga = makeActivity({
    id: "yoga",
    title: "Park yoga",
    category: "yoga",
    startsAt: at(14),
    joined: 6,
    skillLevel: "intermediate",
    spontaneous: true,
    lat: 50.2,
    lng: 8.7,
  });
  const tomorrow = makeActivity({ id: "tomorrow", startsAt: at(9, 2), lat: 52.52, lng: 13.405 });
  const past = makeActivity({ id: "past", startsAt: at(10) }); // 2h ago
  const all = [run, yoga, tomorrow, past];

  it("drops activities that started more than 30 minutes ago and sorts by start", () => {
    expect(ids(filterDiscoverActivities(all, base))).toEqual(["yoga", "run", "tomorrow"]);
  });

  it("filters by category and search text", () => {
    expect(ids(filterDiscoverActivities(all, { ...base, category: "yoga" }))).toEqual(["yoga"]);
    expect(ids(filterDiscoverActivities(all, { ...base, query: "PARK" }))).toEqual(["yoga"]);
  });

  it("filters by level and spontaneous vibe (QA-011)", () => {
    const f = { ...DEFAULT_FILTERS, level: "intermediate" as const };
    expect(ids(filterDiscoverActivities(all, { ...base, filters: f }))).toEqual(["yoga"]);
    const s = { ...DEFAULT_FILTERS, spontaneousOnly: true };
    expect(ids(filterDiscoverActivities(all, { ...base, filters: s }))).toEqual(["yoga"]);
  });

  it("'Today' excludes tomorrow morning", () => {
    const f = { ...DEFAULT_FILTERS, when: "today" as const };
    expect(ids(filterDiscoverActivities(all, { ...base, filters: f }))).toEqual(["yoga", "run"]);
  });

  it("sorts by popularity and by distance", () => {
    const popular = { ...DEFAULT_FILTERS, sort: "popular" as const };
    expect(ids(filterDiscoverActivities(all, { ...base, filters: popular }))[0]).toBe("yoga");
    const nearest = { ...DEFAULT_FILTERS, sort: "nearest" as const };
    expect(ids(filterDiscoverActivities(all, { ...base, filters: nearest }))).toEqual([
      "run",
      "yoga",
      "tomorrow",
    ]);
  });
});
