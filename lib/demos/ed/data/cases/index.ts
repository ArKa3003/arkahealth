// @ts-nocheck
/**
 * Unified case index - exports all cases, getCaseBySlug, getCaseById, getImagingRatingsForCase
 */

import { headacheCases, getHeadacheCaseBySlug, headacheImagingRatings } from "./headache";
import { lowBackPainCases, getLBPCaseBySlug, lowBackPainImagingRatings } from "./low-back-pain";
import { chestPainCases, getChestPainCaseBySlug, chestPainImagingRatings } from "./chest-pain";
import { abdominalPainCases, getAbdominalPainCaseBySlug, abdominalPainImagingRatings } from "./abdominal-pain";
import { extremityTraumaCases, getExtremityTraumaCaseBySlug, extremityTraumaImagingRatings } from "./extremity-trauma";
import type { Case, CaseImagingRating } from "@/lib/demos/ed/types";

// Export all cases
export const allCases: Case[] = [
  ...headacheCases,
  ...lowBackPainCases,
  ...chestPainCases,
  ...abdominalPainCases,
  ...extremityTraumaCases,
];

/**
 * Get a case by slug from any category
 */
export function getCaseBySlug(slug: string): Case | undefined {
  return (
    getHeadacheCaseBySlug(slug) ||
    getLBPCaseBySlug(slug) ||
    getChestPainCaseBySlug(slug) ||
    getAbdominalPainCaseBySlug(slug) ||
    getExtremityTraumaCaseBySlug(slug)
  );
}

/**
 * Get a case by ID
 */
export function getCaseById(id: string): Case | undefined {
  return allCases.find((c) => c.id === id);
}

/** Merged imaging ratings by case id */
const allImagingRatings: Record<string, Array<{ imaging_option_id: string; acr_rating: number; rating_category: string; rationale: string }>> = {
  ...headacheImagingRatings,
  ...lowBackPainImagingRatings,
  ...chestPainImagingRatings,
  ...abdominalPainImagingRatings,
  ...extremityTraumaImagingRatings,
};

/**
 * Get imaging ratings for a case (ACR 1-9 per option).
 */
export function getImagingRatingsForCase(caseId: string): CaseImagingRating[] {
  const raw = allImagingRatings[caseId];
  if (!raw) return [];
  const ts = new Date().toISOString();
  return raw.map((r, i) => ({
    id: `rating-${caseId}-${r.imaging_option_id}-${i}`,
    case_id: caseId,
    imaging_option_id: r.imaging_option_id,
    acr_rating: r.acr_rating,
    rating_category: r.rating_category as CaseImagingRating["rating_category"],
    rationale: r.rationale,
    acr_reference: "ACR Appropriateness Criteria",
    created_at: ts,
    updated_at: ts,
  }));
}
