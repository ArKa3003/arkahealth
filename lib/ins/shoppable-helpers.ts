/**
 * Distance and pricing helpers for shoppable imaging site APIs.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Haversine distance in miles between two WGS84 points.
 *
 * @param a - First coordinate.
 * @param b - Second coordinate.
 */
export function haversineMiles(a: LatLng, b: LatLng): number {
  const R = 3958.8;
  const dLat = deg2rad(b.lat - a.lat);
  const dLon = deg2rad(b.lng - a.lng);
  const lat1 = deg2rad(a.lat);
  const lat2 = deg2rad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

function deg2rad(d: number): number {
  return (d * Math.PI) / 180;
}

/**
 * Lower-bound comparator for shopping: best-case out-of-pocket floor using listed cash vs contracted allowed.
 *
 * @param negotiatedRate - Representative in-network allowed amount when present.
 * @param cashPrice - Cash/self-pay list price when present.
 */
export function patientCostFloor(negotiatedRate: number | null, cashPrice: number | null): number {
  const n = negotiatedRate != null && negotiatedRate > 0 ? negotiatedRate : Number.POSITIVE_INFINITY;
  const c = cashPrice != null && cashPrice > 0 ? cashPrice : Number.POSITIVE_INFINITY;
  return Math.min(n, c);
}

/**
 * Loss-framed comparison sentence (no gain framing).
 *
 * @param expensiveName - Higher-cost site name.
 * @param cheapName - Lower-cost site name.
 * @param deltaUsd - Positive dollar difference.
 */
export function lossFramedComparison(
  expensiveName: string,
  cheapName: string,
  deltaUsd: number,
): string {
  const amt = Math.round(deltaUsd);
  return `Choosing ${expensiveName} would cost this patient $${amt.toLocaleString("en-US")} more than ${cheapName} for the same study.`;
}
