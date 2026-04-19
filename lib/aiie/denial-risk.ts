/**
 * INS-specific mapping from clinical appropriateness to payer workflow bands.
 */

export type INSAuthorizationBand =
  | "AUTO_APPROVE"
  | "LIKELY_APPROVE"
  | "CLINICAL_REVIEW"
  | "LIKELY_DENY";

/**
 * Maps a 1–9 clinical appropriateness score to a mirrored denial-risk index used in PA routing.
 *
 * @param clinicalScore - AIIE clinical appropriateness on 1–9 (higher is more appropriate).
 * @returns Denial-risk proxy on 1–9 (`10 - clinicalScore`, clamped).
 */
export function invertToDenialRisk(clinicalScore: number): number {
  return Math.max(1, Math.min(9, 10 - clinicalScore));
}

/**
 * Routes a case to an INS authorization band using denial risk and gold-card status.
 *
 * @param denialRisk - Value produced by {@link invertToDenialRisk}.
 * @param goldCard - Whether the ordering provider holds gold-card status for the service.
 * @returns Recommended handling band for automation and human review queues.
 */
export function classifyAction(
  denialRisk: number,
  goldCard: boolean,
): INSAuthorizationBand {
  if (goldCard) {
    return "AUTO_APPROVE";
  }
  if (denialRisk <= 3) {
    return "LIKELY_APPROVE";
  }
  if (denialRisk <= 6) {
    return "CLINICAL_REVIEW";
  }
  return "LIKELY_DENY";
}
