/**
 * Approximate ZIP centroids for shoppable distance filters (WGS84).
 * Seeded facility rows use addresses in these metros; broader prefix fallbacks cover nearby ZIPs.
 */

import type { LatLng } from "@/lib/ins/shoppable-helpers";

/** Exact ZIP → centroid for seeded corridors (5 metros). */
export const ZIP_CENTROIDS: Record<string, LatLng> = {
  // Kansas City metro — coordinates approximate downtown/midtown anchors.
  "64108": { lat: 39.0997, lng: -94.5786 },
  "64111": { lat: 39.0519, lng: -94.5939 },
  "64112": { lat: 39.0344, lng: -94.6058 },
  "64114": { lat: 38.9631, lng: -94.605 },
  "64131": { lat: 38.9856, lng: -94.5964 },
  "66204": { lat: 39.0094, lng: -94.6706 },
  // Dallas–Fort Worth
  "75201": { lat: 32.7767, lng: -96.797 },
  "75204": { lat: 32.7935, lng: -96.7664 },
  "75219": { lat: 32.8121, lng: -96.8119 },
  "75235": { lat: 32.8212, lng: -96.8355 },
  "76104": { lat: 32.7555, lng: -97.3308 },
  "76107": { lat: 32.7514, lng: -97.3878 },
  // Phoenix
  "85004": { lat: 33.4484, lng: -112.074 },
  "85006": { lat: 33.4656, lng: -112.0484 },
  "85013": { lat: 33.5088, lng: -112.0829 },
  "85016": { lat: 33.4952, lng: -112.0318 },
  "85258": { lat: 33.5829, lng: -111.896 },
  // Atlanta
  "30303": { lat: 33.749, lng: -84.388 },
  "30308": { lat: 33.7756, lng: -84.384 },
  "30309": { lat: 33.8043, lng: -84.3893 },
  "30318": { lat: 33.7897, lng: -84.4706 },
  "30342": { lat: 33.9056, lng: -84.3822 },
  // New York City
  "10001": { lat: 40.7484, lng: -73.9967 },
  "10016": { lat: 40.7452, lng: -73.9789 },
  "10029": { lat: 40.7914, lng: -73.9496 },
  "11201": { lat: 40.6945, lng: -73.989 },
  "11373": { lat: 40.7365, lng: -73.8789 },
};

const PREFIX_METROS: Array<{ prefixes: string[]; center: LatLng }> = [
  { prefixes: ["641", "640", "662"], center: { lat: 39.05, lng: -94.59 } },
  { prefixes: ["752", "761", "750"], center: { lat: 32.85, lng: -96.85 } },
  { prefixes: ["850", "852", "853"], center: { lat: 33.45, lng: -112.07 } },
  { prefixes: ["303", "300", "301", "302"], center: { lat: 33.76, lng: -84.39 } },
  { prefixes: ["100", "101", "102", "103", "104", "111", "112", "113", "114"], center: { lat: 40.73, lng: -73.99 } },
];

/**
 * Resolves a ZIP5 to a centroid for distance filtering.
 *
 * @param zip5 - Five-digit U.S. ZIP.
 */
export function latLngFromZip(zip5: string): LatLng | null {
  const exact = ZIP_CENTROIDS[zip5];
  if (exact) {
    return exact;
  }
  const pre3 = zip5.slice(0, 3);
  for (const m of PREFIX_METROS) {
    if (m.prefixes.some((p) => pre3 === p || zip5.startsWith(p))) {
      return m.center;
    }
  }
  return null;
}
