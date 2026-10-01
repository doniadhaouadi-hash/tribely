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
  lat: string;
  lon: string;
  address?: Record<string, string>;
};

/** Address/place search for autocomplete-style suggestions (e.g. hosting an activity). */
export const searchPlaces = async (
  query: string,
  signal?: AbortSignal,
  near?: { lat: number; lng: number },
): Promise<GeoPlace[]> => {
  const q = query.trim();
  if (q.length < 3) return [];
  let url = `${NOMINATIM_BASE}/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=5&addressdetails=0`;
  if (near) {
    // Soft bias toward the current city — doesn't exclude results elsewhere (bounded=0).
    const d = 0.6;
    const viewbox = [near.lng - d, near.lat + d, near.lng + d, near.lat - d].join(",");
    url += `&viewbox=${viewbox}&bounded=0`;
  }
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Search failed");
  const data = (await res.json()) as NominatimResult[];
  return data.map((r) => ({
    label: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  }));
};

/** City search for the location switcher (Frankfurt, Berlin, …). */
export const searchCities = async (query: string, signal?: AbortSignal): Promise<GeoCity[]> => {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `${NOMINATIM_BASE}/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=6&addressdetails=1&featureType=city`;
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
  const url = `${NOMINATIM_BASE}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
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
