import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { FEED_GRACE_MS, feedStartCutoff, rowToActivity } from "@/lib/activitiesApi";
import type { Database } from "@/integrations/supabase/types";

type ActivityRow = Database["public"]["Tables"]["activities"]["Row"];

const row = (over: Partial<ActivityRow> = {}): ActivityRow => ({
  id: "a1",
  host_id: "h1",
  title: "Morning run",
  description: null,
  category: "tennis",
  level_required: "advanced",
  location_name: "Park",
  address: null,
  lat: 50.1,
  lng: 8.6,
  start_at: "2026-10-02T08:00:00.000Z",
  duration_min: 60,
  max_participants: 8,
  participant_count: 3,
  price_cents: 0,
  currency: "EUR",
  language: "en",
  spontaneous: false,
  status: "open",
  cover_url: null,
  created_at: "2026-10-01T00:00:00.000Z",
  updated_at: "2026-10-01T00:00:00.000Z",
  ...over,
});

describe("feedStartCutoff", () => {
  it("excludes activities that started more than 30 minutes ago (QA-010)", () => {
    const now = Date.parse("2026-10-01T12:00:00.000Z");
    expect(FEED_GRACE_MS).toBe(30 * 60_000);
    expect(feedStartCutoff(now)).toBe("2026-10-01T11:30:00.000Z");
  });
});

describe("rowToActivity", () => {
  it("maps DB enums and fields to the UI model", () => {
    const a = rowToActivity(row(), { id: "h1", display_name: " Ana ", avatar_url: null, rating: 4.5 });
    expect(a.category).toBe("tennis_padel");
    expect(a.skillLevel).toBe("committed");
    expect(a.address).toBe("Park");
    expect(a.capacity).toBe(8);
    expect(a.joined).toBe(3);
    expect(a.host.displayName).toBe("Ana");
    expect(a.host.rating).toBe(4.5);
  });

  it("falls back when the host profile is missing", () => {
    const a = rowToActivity(row({ category: "dance", level_required: "beginner" }), null);
    expect(a.category).toBe("dance_fitness");
    expect(a.skillLevel).toBe("casual");
    expect(a.host.displayName).toBe("Host");
    expect(a.host.avatarSeed).toBe("h1");
    expect(a.host.rating).toBeNull();
  });
});

describe("host rating (QA-032)", () => {
  it("treats the DB default 0 as 'not rated' instead of 5.0", () => {
    const a = rowToActivity(row(), { id: "h1", display_name: "Ana", avatar_url: null, rating: 0 });
    expect(a.host.rating).toBeNull();
  });
});
