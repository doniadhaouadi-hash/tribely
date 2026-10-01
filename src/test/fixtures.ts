import type { MockActivity } from "@/data/activities";

/** A valid activity for tests; override only what the test cares about. */
export const makeActivity = (over: Partial<MockActivity> = {}): MockActivity => ({
  id: "a1",
  title: "Sunset 5K",
  description: "Easy pace along the river",
  category: "running",
  lat: 50.1109,
  lng: 8.6821,
  address: "Eiserner Steg, Frankfurt",
  city: "Frankfurt",
  startsAt: "2026-10-01T18:00:00.000Z",
  durationMinutes: 60,
  capacity: 8,
  joined: 2,
  skillLevel: "casual",
  spontaneous: false,
  coverUrl: null,
  host: { id: "h1", displayName: "Ana", avatarSeed: "h1", avatarUrl: null, rating: 4.8 },
  ...over,
});
