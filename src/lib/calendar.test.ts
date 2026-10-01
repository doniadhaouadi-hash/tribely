import { describe, expect, it } from "vitest";
import { buildIcs } from "@/lib/calendar";
import { makeActivity } from "@/test/fixtures";

describe("buildIcs", () => {
  const ics = buildIcs(
    makeActivity({
      id: "abc",
      title: "Run, then coffee; yes",
      startsAt: "2026-10-01T18:00:00.000Z",
      durationMinutes: 90,
    }),
  );
  const lines = ics.split("\r\n");

  it("is a CRLF-separated VCALENDAR with one event", () => {
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines.at(-1)).toBe("END:VCALENDAR");
    expect(lines.filter((l) => l === "BEGIN:VEVENT")).toHaveLength(1);
  });

  it("uses UTC start/end derived from the duration", () => {
    expect(lines).toContain("DTSTART:20261001T180000Z");
    expect(lines).toContain("DTEND:20261001T193000Z");
  });

  it("escapes commas and semicolons and links back to the activity", () => {
    expect(lines).toContain("SUMMARY:Run\\, then coffee\\; yes");
    expect(lines).toContain("UID:abc@tribely.app");
    expect(lines.some((l) => l.startsWith("URL:") && l.endsWith("/?activity=abc"))).toBe(true);
  });
});
