// Mean radius of the Earth in kilometres
const EARTH_KM = 6371;

/**
 * Haversine formula — calculates the great-circle distance between two
 * geographic coordinates. Accurate enough for distances up to ~500 km.
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  // Math.min(1, ...) clamps floating-point imprecision that can push sqrt > 1
  // which would make asin return NaN for points that are effectively the same.
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

// Parses a coordinate value from a query string (may arrive as a string).
// Returns null for empty, missing, or non-numeric values.
export function parseCoord(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
