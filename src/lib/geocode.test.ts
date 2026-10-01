import { describe, expect, it } from "vitest";
import {
  acceptLanguage,
  clampLocation,
  dedupeByLabel,
  MAX_LOCATION_LENGTH,
  shortPlaceLabel,
} from "@/lib/geocode";

// The suggestion Donia picked live (125 characters).
const GALLERIA =
  "Galleria Mall, Hamouda Bin Ali Al Dhaheri Street, Al Maryah Island, Abu Dhabi, Emirat Abu Dhabi, Vereinigte Arabische Emirate";

describe("location labels (QA-028)", () => {
  it("never exceeds the 120-character validation limit", () => {
    expect(GALLERIA.length).toBeGreaterThan(MAX_LOCATION_LENGTH);
    const out = clampLocation(GALLERIA);
    expect(out.length).toBeLessThanOrEqual(MAX_LOCATION_LENGTH);
    expect(out).toBe(
      "Galleria Mall, Hamouda Bin Ali Al Dhaheri Street, Al Maryah Island, Abu Dhabi, Emirat Abu Dhabi",
    );
  });

  it("hard-cuts a single very long segment", () => {
    const out = clampLocation("x".repeat(200));
    expect(out.length).toBe(MAX_LOCATION_LENGTH);
    expect(out.endsWith("…")).toBe(true);
  });

  it("leaves short text alone", () => {
    expect(clampLocation("  Eiserner Steg  ")).toBe("Eiserner Steg");
  });

  it("builds a compact label from Nominatim address parts", () => {
    expect(
      shortPlaceLabel({
        display_name: GALLERIA,
        name: "Galleria Mall",
        address: {
          road: "Hamouda Bin Ali Al Dhaheri Street",
          suburb: "Al Maryah Island",
          city: "Abu Dhabi",
          state: "Emirat Abu Dhabi",
          country: "Vereinigte Arabische Emirate",
        },
      }),
    ).toBe("Galleria Mall, Hamouda Bin Ali Al Dhaheri Street, Al Maryah Island, Abu Dhabi");
  });

  it("falls back to the first display_name segment and skips duplicates", () => {
    expect(
      shortPlaceLabel({
        display_name: "Frankfurt am Main, Hessen, Deutschland",
        address: { city: "Frankfurt am Main" },
      }),
    ).toBe("Frankfurt am Main");
  });
});

describe("acceptLanguage (QA-029)", () => {
  it("asks Nominatim for the browser language with English fallback", () => {
    expect(decodeURIComponent(acceptLanguage(["de-DE", "de"]))).toBe("de-DE,de,en");
    expect(decodeURIComponent(acceptLanguage(["en-US", "en"]))).toBe("en-US,en");
    expect(acceptLanguage([])).toBe("en");
  });
});

describe("dedupeByLabel (QA-030)", () => {
  it("keeps the first of several results with the same label", () => {
    const yas = "Yas Mall, Al Khuyoul Street, Yas Island, Abu Dhabi";
    const out = dedupeByLabel([
      { label: yas, lat: 1, lng: 1 },
      { label: yas.toUpperCase(), lat: 2, lng: 2 },
      { label: "Yas Marina", lat: 3, lng: 3 },
    ]);
    expect(out.map((p) => p.lat)).toEqual([1, 3]);
  });
});
