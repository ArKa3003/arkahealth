import type { ImagingDesertRegion } from "../types";

export const IMAGING_DESERT_REGIONS: ImagingDesertRegion[] = [
  {
    id: "id-001",
    name: "Northwest Kansas",
    state: "KS",
    county: "Cheyenne County",
    population: 2600,
    coordinates: { lat: 39.79, lng: -101.73 },
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
    coordinates: { lat: 36.73, lng: -102.51 },
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
    coordinates: { lat: 33.08, lng: -89.92 },
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

/** Map markers / list labels — derived from {@link IMAGING_DESERT_REGIONS} */
export const imagingDesertPoints = IMAGING_DESERT_REGIONS.map((r) => ({
  id: r.id,
  label: r.name,
  lat: r.coordinates.lat,
  lng: r.coordinates.lng,
  accessScore: 100 - Math.min(100, r.healthDisparityIndex),
}));
