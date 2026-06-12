import type { ImagingDesertRegion } from "../types";

/** ARKA rural intelligence hub — Topeka, KS service coordination center (demo). */
export const IMAGING_ACCESS_HUB = {
  name: "ARKA Hub",
  lat: 39.05,
  lng: -95.7,
} as const;

/** Shared access-score bands for maps, risk cards, and outcome views. */
export const ACCESS_SEVERITY_THRESHOLDS = {
  /** At or above: adequate access (teal). */
  adequate: 40,
  /** At or above: strained access (amber). */
  strained: 20,
  /** At or above: moderate access (orange). */
  moderate: 12,
} as const;

export type AccessSeverityBand = "adequate" | "strained" | "moderate" | "critical";

/** Teal → amber → orange → red severity ramp (fill + stroke). */
export const ACCESS_SEVERITY_RAMP: Record<
  AccessSeverityBand,
  { fill: string; stroke: string; label: string }
> = {
  adequate: { fill: "#14B8A6", stroke: "#0D9488", label: "Adequate" },
  strained: { fill: "#F59E0B", stroke: "#D97706", label: "Strained" },
  moderate: { fill: "#F97316", stroke: "#EA580C", label: "Moderate" },
  critical: { fill: "#EF4444", stroke: "#DC2626", label: "Critical" },
};

const FIPS_TO_STATE: Record<string, string> = {
  "20": "KS",
  "40": "OK",
  "28": "MS",
};

/** States highlighted on the imaging access map. */
export const IMAGING_ACCESS_HOST_STATES = new Set(Object.values(FIPS_TO_STATE));

/** Central / southern US states shown in the fitted map viewport. */
export const IMAGING_MAP_STATE_FIPS = new Set([
  "05",
  "08",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "28",
  "29",
  "35",
  "40",
  "47",
  "48",
]);

/**
 * Returns the severity band for an imaging access score (0–100, higher is better).
 */
export function getAccessSeverityBand(score: number): AccessSeverityBand {
  if (score >= ACCESS_SEVERITY_THRESHOLDS.adequate) return "adequate";
  if (score >= ACCESS_SEVERITY_THRESHOLDS.strained) return "strained";
  if (score >= ACCESS_SEVERITY_THRESHOLDS.moderate) return "moderate";
  return "critical";
}

/**
 * Returns fill/stroke colors for a given access score.
 */
export function getAccessSeverityColors(score: number): { fill: string; stroke: string } {
  const band = getAccessSeverityBand(score);
  const { fill, stroke } = ACCESS_SEVERITY_RAMP[band];
  return { fill, stroke };
}

/**
 * Marker radius in SVG pixels — lower access scores render larger markers.
 */
export function getAccessMarkerRadius(score: number): number {
  return 7 + ((100 - score) / 100) * 7;
}

/**
 * One-line modality gap summary for map tooltips.
 */
export function getModalityGapSummary(region: ImagingDesertRegion): string {
  const distant = region.nearestModalities
    .filter((m) => m.distanceMiles > 45)
    .sort((a, b) => b.distanceMiles - a.distanceMiles);

  if (distant.length === 0) {
    return "Core modalities available within 45 mi";
  }

  const top = distant.slice(0, 2).map((m) => `${m.modality} ${m.distanceMiles} mi`);
  return top.join("; ");
}

export const IMAGING_DESERT_REGIONS: ImagingDesertRegion[] = [
  {
    id: "id-001",
    name: "Northwest Kansas",
    state: "KS",
    county: "Cheyenne County",
    population: 2600,
    coordinates: { lat: 39.4, lng: -100.8 },
    nearestModalities: [
      { modality: "X-ray", nearestFacility: "Cheyenne County Hospital", distanceMiles: 5, driveTimeMinutes: 8 },
      { modality: "CT", nearestFacility: "Goodland Regional Medical Center", distanceMiles: 42, driveTimeMinutes: 45 },
      { modality: "MRI", nearestFacility: "Citizens Medical Center, Colby", distanceMiles: 68, driveTimeMinutes: 70 },
      { modality: "PET-CT", nearestFacility: "University of Kansas Medical Center", distanceMiles: 340, driveTimeMinutes: 310 },
    ],
    healthDisparityIndex: 78,
    uninsuredRate: 12.4,
    medianIncome: 38200,
    smokingRate: 22.1,
    obesityRate: 34.8,
    cancerScreeningRate: 41.2,
  },
  {
    id: "id-002",
    name: "Oklahoma Panhandle",
    state: "OK",
    county: "Cimarron County",
    population: 2100,
    coordinates: { lat: 36.7, lng: -101.5 },
    nearestModalities: [
      { modality: "X-ray", nearestFacility: "Cimarron County REH", distanceMiles: 3, driveTimeMinutes: 5 },
      { modality: "CT", nearestFacility: "Cimarron County REH (mobile)", distanceMiles: 3, driveTimeMinutes: 5 },
      { modality: "MRI", nearestFacility: "Northwest Texas Healthcare", distanceMiles: 130, driveTimeMinutes: 120 },
      { modality: "PET-CT", nearestFacility: "BSA Health System, Amarillo", distanceMiles: 135, driveTimeMinutes: 125 },
    ],
    healthDisparityIndex: 85,
    uninsuredRate: 18.7,
    medianIncome: 32100,
    smokingRate: 24.3,
    obesityRate: 38.2,
    cancerScreeningRate: 35.8,
  },
  {
    id: "id-003",
    name: "Mississippi Delta",
    state: "MS",
    county: "Holmes County",
    population: 17200,
    coordinates: { lat: 33.8, lng: -90.9 },
    nearestModalities: [
      { modality: "X-ray", nearestFacility: "Holmes County Community Hospital", distanceMiles: 8, driveTimeMinutes: 12 },
      { modality: "CT", nearestFacility: "University of Mississippi Medical Center, Grenada", distanceMiles: 45, driveTimeMinutes: 50 },
      { modality: "MRI", nearestFacility: "UMMC, Jackson", distanceMiles: 62, driveTimeMinutes: 75 },
      { modality: "PET-CT", nearestFacility: "UMMC, Jackson", distanceMiles: 62, driveTimeMinutes: 75 },
    ],
    healthDisparityIndex: 92,
    uninsuredRate: 22.1,
    medianIncome: 24800,
    smokingRate: 26.5,
    obesityRate: 42.1,
    cancerScreeningRate: 28.4,
  },
];

/** Map markers / list labels — derived from {@link IMAGING_DESERT_REGIONS}. */
export const imagingDesertPoints = IMAGING_DESERT_REGIONS.map((r) => ({
  id: r.id,
  label: r.name,
  lat: r.coordinates.lat,
  lng: r.coordinates.lng,
  state: r.state,
  accessScore: 100 - Math.min(100, r.healthDisparityIndex),
  modalityGapSummary: getModalityGapSummary(r),
  region: r,
}));

/** Screen-reader summary of all tracked region access scores. */
export const imagingAccessMapAriaLabel = imagingDesertPoints
  .map((p) => `${p.label} access score ${p.accessScore} out of 100`)
  .join("; ");
