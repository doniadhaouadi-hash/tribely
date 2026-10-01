/** Haversine distance in km between two lat/lng pairs. */
export const distanceKm = (
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

export const formatDistance = (km: number): string => {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
};

/** "Nearby" means within this distance of the selected city (Discover default, Map, stats). */
export const DEFAULT_RADIUS_KM = 30;

/** Is the point within `radiusKm` of the origin? A radius of 0 means "any distance". */
export const isWithinRadius = (
  origin: { lat: number; lng: number },
  point: { lat: number; lng: number },
  radiusKm: number,
) => radiusKm <= 0 || distanceKm(origin.lat, origin.lng, point.lat, point.lng) <= radiusKm;
