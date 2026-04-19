import type { ServiceRequest } from "@/lib/types/fhir";

/**
 * Structured hints inferred from ServiceRequest narrative notes when the EHR does not
 * supply separate Observation resources for the same facts.
 */
export interface ClinicalDocumentationHints {
  /** True when notes describe a recent prior study suggesting redundancy review. */
  priorImaging?: boolean;
  /** Human-readable recency string for redundancy modeling (e.g. "2 weeks ago"). */
  priorImagingTimeframe?: string;
  /** Whether conservative management was documented before advanced imaging. */
  conservativeManagementTried?: boolean;
  /** Duration string when conservative care is documented (e.g. "6 weeks physical therapy"). */
  conservativeManagementDuration?: string;
}

/**
 * Derives clinical documentation hints from `ServiceRequest.note` text for AIIE scoring.
 * Conservative care and prior-imaging patterns align with how clinicians free-text orders.
 *
 * @param sr - Active imaging ServiceRequest, typically from CDS prefetch.
 * @returns Partial hints; omitted fields are left to caller defaults.
 */
export function clinicalDocumentationHintsFromServiceRequest(
  sr: ServiceRequest,
): ClinicalDocumentationHints {
  const notes = (sr.note ?? []).map((n) => n.text ?? "").join("\n");
  const text = notes.trim();
  if (!text) {
    return {};
  }
  const lower = text.toLowerCase();

  const hints: ClinicalDocumentationHints = {};

  const priorMatch =
    /\bprior\s+[^.\n]{0,160}?\b(ct|computed tomography|mri|x-?ray|imaging|study|exam)\b/i.exec(
      text,
    );
  const recentMatch = /\b(\d+)\s*(day|week|month)s?\s*ago\b/i.exec(lower);
  if (priorMatch && recentMatch) {
    hints.priorImaging = true;
    const n = recentMatch[1] ?? "1";
    const unit = recentMatch[2] ?? "week";
    hints.priorImagingTimeframe = `${n} ${unit}${n === "1" ? "" : "s"} ago`;
  }

  if (
    /\b(?:completed|finished|underwent)\s+\d+\s*weeks?\s+(?:of\s+)?(?:pt|physical therapy)\b/i.test(
      lower,
    ) ||
    /\b6\s*weeks?\s+(?:of\s+)?(?:pt|physical therapy)\b/i.test(lower) ||
    (/\bconservative\s+(?:care|management|therapy)\b/i.test(lower) &&
      !/\bno\s+documented\s+conservative\b/i.test(lower))
  ) {
    hints.conservativeManagementTried = true;
    const m = /\b(4|6|8)\s*weeks?\s+(?:of\s+)?(?:pt|physical therapy)\b/i.exec(lower);
    if (m) {
      hints.conservativeManagementDuration = `${m[1]} weeks physical therapy`;
    }
  }

  if (
    /\bno\s+(?:documented\s+)?conservative\b/i.test(lower) ||
    /\bconservative\s+(?:care\s+)?not\s+(?:tried|documented|completed)\b/i.test(lower)
  ) {
    hints.conservativeManagementTried = false;
  }

  return hints;
}
