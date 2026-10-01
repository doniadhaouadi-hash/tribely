import { beforeEach, describe, expect, it } from "vitest";
import { cityFromProfile, loadStoredCity, sameCity, storeCity } from "@/lib/cityStorage";

const berlin = { name: "Berlin", country: "Germany", countryCode: "DE", lat: 52.52, lng: 13.405 };

describe("city persistence (QA-023)", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips the picked city through localStorage", () => {
    expect(loadStoredCity()).toBeNull();
    storeCity(berlin);
    expect(loadStoredCity()).toEqual(berlin);
  });

  it("ignores corrupt stored values", () => {
    localStorage.setItem("tribely:city", "{not json");
    expect(loadStoredCity()).toBeNull();
    localStorage.setItem("tribely:city", JSON.stringify({ name: "X", lat: "1" }));
    expect(loadStoredCity()).toBeNull();
  });

  it("builds the city from the profile, keeping country info when it's the same place", () => {
    const profile = { city: "Berlin", lat: 52.52, lng: 13.405 };
    expect(cityFromProfile(profile, berlin)).toEqual(berlin);
    expect(cityFromProfile({ city: "Paris", lat: 48.85, lng: 2.35 }, berlin)).toEqual({
      name: "Paris",
      country: "",
      countryCode: "",
      lat: 48.85,
      lng: 2.35,
    });
  });

  it("compares places by name and rounded coordinates", () => {
    expect(sameCity(berlin, { city: "Berlin", lat: 52.5200001, lng: 13.405 })).toBe(true);
    expect(sameCity(berlin, { city: "Berlin", lat: 50.11, lng: 8.68 })).toBe(false);
  });
});
