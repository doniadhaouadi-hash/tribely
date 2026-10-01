import type { City } from "@/context/LocationContext";

const KEY = "tribely:city";

const isCity = (v: unknown): v is City => {
  if (!v || typeof v !== "object") return false;
  const c = v as Record<string, unknown>;
  return (
    typeof c.name === "string" &&
    c.name.length > 0 &&
    typeof c.country === "string" &&
    typeof c.countryCode === "string" &&
    typeof c.lat === "number" &&
    typeof c.lng === "number" &&
    Number.isFinite(c.lat) &&
    Number.isFinite(c.lng)
  );
};

/** City the user picked last time on this device, if any. */
export const loadStoredCity = (): City | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isCity(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const storeCity = (city: City) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(city));
  } catch {
    // storage unavailable (private mode etc.) — city lasts until reload
  }
};

/**
 * City from a profile row. Profiles only keep name + coordinates, so country
 * info is taken from the locally stored city when it's the same place.
 */
export const cityFromProfile = (
  profile: { city: string; lat: number; lng: number },
  stored: City | null,
): City => {
  if (stored && stored.name === profile.city) {
    return { ...stored, lat: profile.lat, lng: profile.lng };
  }
  return { name: profile.city, country: "", countryCode: "", lat: profile.lat, lng: profile.lng };
};

/** Same place? (Coordinates rounded to ~100 m to ignore float noise.) */
export const sameCity = (a: City, b: { city?: string; name?: string; lat: number; lng: number }) =>
  a.name === (b.name ?? b.city) &&
  Math.abs(a.lat - b.lat) < 0.001 &&
  Math.abs(a.lng - b.lng) < 0.001;
