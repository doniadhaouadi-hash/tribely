import { describe, expect, it } from "vitest";
import { timeWindowEnd } from "@/lib/timeWindow";

describe("timeWindowEnd", () => {
  const now = new Date(2026, 9, 1, 21, 30); // 1 Oct 2026, 21:30 local

  it("'today' ends at local midnight, not now + 24h (QA-011)", () => {
    const end = new Date(timeWindowEnd("today", now));
    expect(end.getDate()).toBe(1);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    // tomorrow morning is not "today"
    expect(new Date(2026, 9, 2, 8, 0).getTime()).toBeGreaterThan(end.getTime());
  });

  it("handles the relative windows", () => {
    expect(timeWindowEnd("any", now)).toBe(Infinity);
    expect(timeWindowEnd("6h", now)).toBe(now.getTime() + 6 * 3600_000);
    expect(timeWindowEnd("3d", now)).toBe(now.getTime() + 72 * 3600_000);
  });
});
