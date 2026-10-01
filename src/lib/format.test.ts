import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatActivityTime } from "@/lib/format";

describe("formatActivityTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 1, 12, 0)); // Thu 1 Oct 2026, 12:00 local
  });
  afterEach(() => vi.useRealTimers());

  it("shows minutes for activities starting within 90 minutes", () => {
    expect(formatActivityTime(new Date(2026, 9, 1, 12, 45).toISOString())).toMatch(/^In 45m · /);
  });

  it("says Today later the same day", () => {
    expect(formatActivityTime(new Date(2026, 9, 1, 19, 0).toISOString())).toMatch(/^Today · /);
  });

  it("says Tomorrow for the next day", () => {
    expect(formatActivityTime(new Date(2026, 9, 2, 9, 0).toISOString())).toMatch(/^Tomorrow · /);
  });

  it("shows weekday and date further out", () => {
    const out = formatActivityTime(new Date(2026, 9, 5, 9, 0).toISOString());
    expect(out).not.toMatch(/^(Today|Tomorrow|In )/);
    expect(out).toContain("·");
  });
});
