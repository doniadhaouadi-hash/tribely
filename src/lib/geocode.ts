// Free, no-API-key geocoding via OpenStreetMap's Nominatim. Usage is rate
// limited (~1 req/sec) and meant for light client-side use — fine for a
// debounced search box, not for bulk/background geocoding.

export type GeoPlace = {
  label: string;
  lat: number;
  lng: number;
};

export type GeoCity = GeoPlace & {
  country: string;
  countryCode: string;
};

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

type NominatimResult = {
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
};

/**
 * Language for Nominatim results: the browser language with English as
 * fallback. Without it, street/area names come in the local script (e.g.
 * Arabic) while the place name is Latin, giving mixed labels (QA-029).
 */
export const acceptLanguage = (
  languages: readonly string[] = typeof navigator !== "undefined" ? navigator.languages ?? [] : [],
) => {
  const langs = [...languages.filter(Boolean), "en"];
  return encodeURIComponent(Array.from(new Set(langs)).join(","));
};

/** Max length of an activity location (matches the Create/Edit validation). */
export const MAX_LOCATION_LENGTH = 120;

/**
 * Shortens text to at most `max` characters, cutting at a ", " boundary when
 * possible, so a picked suggestion always passes validation (QA-028).
 */
export const clampLocation = (text: string, max = MAX_LOCATION_LENGTH): string => {
  const t = text.trim();
  if (t.length <= max) return t;
  const parts = t.split(", ");
  let out = parts[0];
  for (const p of parts.slice(1)) {
    if (`${out}, ${p}`.length > max) break;
    out = `${out}, ${p}`;
  }
  return out.length <= max ? out : `${out.slice(0, max - 1).trimEnd()}…`;
};

/**
 * Compact label for a search result: place name, street, area, city — instead
 * of Nominatim's full display_name (which adds state, country, postcode, …).
 */
export const shortPlaceLabel = (
  r: Pick<NominatimResult, "display_name" | "name" | "address">,
): string => {
  const a = r.address ?? {};
  const street = [a.road, a.house_number].filter(Boolean).join(" ");
  const area = a.suburb ?? a.neighbourhood ?? a.quarter ?? a.city_district;
  const city = a.city ?? a.town ?? a.village ?? a.municipality;
  const name = r.name || r.display_name.split(",")[0];
  const parts: string[] = [];
  for (const p of [name, street, area, city]) {
    const v = p?.trim();
    if (v && !parts.includes(v)) parts.push(v);
  }
  return clampLocation(parts.length ? parts.join(", ") : r.display_name);
};

/** Address/place search for autocomplete-style suggestions (e.g. hosting an activity). */
export const searchPlaces = async (
  query: string,
  signal?: AbortSignal,
  near?: { lat: number; lng: number },
): Promise<GeoPlace[]> => {
  const q = query.trim();
  if (q.length < 3) return [];
  let url = `${NOMINATIM_BASE}/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=5&addressdetails=1&accept-language=${acceptLanguage()}`;
  if (near) {
    // Soft bias toward the current city — doesn't exclude results elsewhere (bounded=0).
    const d = 0.6;
    const viewbox = [near.lng - d, near.lat + d, near.lng + d, near.lat - d].join(",");
    url += `&viewbox=${viewbox}&bounded=0`;
  }
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Search failed");
  const data = (await res.json()) as NominatimResult[];
  return dedupeByLabel(
    data.map((r) => ({
      label: shortPlaceLabel(r),
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    })),
  );
};

/**
 * One suggestion per label: OSM often has several objects for one place
 * (e.g. a node and a building) that get the same short label (QA-030).
 * Keeps the first, i.e. best-ranked, hit.
 */
export const dedupeByLabel = <T extends { label: string }>(places: T[]): T[] => {
  const seen = new Set<string>();
  return places.filter((p) => {
    const key = p.label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/** City search for the location switcher (Frankfurt, Berlin, …). */
export const searchCities = async (query: string, signal?: AbortSignal): Promise<GeoCity[]> => {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `${NOMINATIM_BASE}/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=6&addressdetails=1&featureType=city&accept-language=${acceptLanguage()}`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Search failed");
  const data = (await res.json()) as NominatimResult[];
  return data.map((r) => {
    const a = r.address ?? {};
    const name = a.city ?? a.town ?? a.village ?? a.municipality ?? r.display_name.split(",")[0];
    return {
      label: name,
      country: a.country ?? "",
      countryCode: (a.country_code ?? "").toUpperCase(),
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    };
  });
};

/** Reverse-geocode coordinates (e.g. from navigator.geolocation) to a city name. */
export const reverseGeocodeCity = async (lat: number, lng: number): Promise<GeoCity | null> => {
  const url = `${NOMINATIM_BASE}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1&accept-language=${acceptLanguage()}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const r = (await res.json()) as NominatimResult;
  const a = r.address ?? {};
  const name = a.city ?? a.town ?? a.village ?? a.municipality;
  if (!name) return null;
  return {
    label: name,
    country: a.country ?? "",
    countryCode: (a.country_code ?? "").toUpperCase(),
    lat,
    lng,
  };
};
