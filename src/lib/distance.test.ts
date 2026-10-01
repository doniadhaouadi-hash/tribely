import { describe, expect, it } from "vitest";
import { distanceKm, formatDistance } from "@/lib/distance";

describe("distanceKm", () => {
  it("is 0 for the same point", () => {
    expect(distanceKm(50.11, 8.68, 50.11, 8.68)).toBe(0);
  });

  it("matches known city distances (Frankfurt → Berlin ≈ 424 km)", () => {
    const d = distanceKm(50.1109, 8.6821, 52.52, 13.405);
    expect(d).toBeGreaterThan(415);
    expect(d).toBeLessThan(430);
  });

  it("is symmetric", () => {
    expect(distanceKm(1, 2, 3, 4)).toBeCloseTo(distanceKm(3, 4, 1, 2), 10);
  });
});

describe("formatDistance", () => {
  it("uses metres below 1 km, one decimal below 10 km, whole km above", () => {
    expect(formatDistance(0.42)).toBe("420m");
    expect(formatDistance(3.456)).toBe("3.5km");
    expect(formatDistance(12.6)).toBe("13km");
  });
});
