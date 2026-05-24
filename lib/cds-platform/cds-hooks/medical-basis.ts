import { CITATIONS, getCitation } from "@/lib/cds-platform/citations";

/**
 * Authority tier for the evidence underlying a CDS recommendation.
 */
export type AuthorityClass =
  | "guideline"
  | "cms_lcd"
  | "ncd_lcd"
  | "peer_reviewed"
  | "regulatory"
  | "context_dependent";

const AUTHORITY_CLASSES: readonly AuthorityClass[] = [
  "guideline",
  "cms_lcd",
  "ncd_lcd",
  "peer_reviewed",
  "regulatory",
  "context_dependent",
];

/**
 * Structured medical basis attached to every CDS card (playbook Appendix A).
 */
export interface MedicalBasis {
  /** Registry key in {@link CITATIONS} (or `context_dependent`). */
  citationId: string;
  /** Short human-readable label shown in regulatory exports. */
  label: string;
  /** Authority class for the cited source. */
  authorityClass: AuthorityClass;
  /** Clinician-facing rationale tying evidence to this card (plain language). */
  rationale: string;
}

/**
 * Builds a {@link MedicalBasis} from a known citation id and rationale text.
 *
 * @param citationId - Key in {@link CITATIONS}.
 * @param label - Display label (defaults to citation title when omitted).
 * @param authorityClass - Authority tier for the source.
 * @param rationale - Clinician-facing rationale.
 */
export function medicalBasisFromCitation(
  citationId: string,
  authorityClass: AuthorityClass,
  rationale: string,
  label?: string,
): MedicalBasis {
  const citation = getCitation(citationId);
  return {
    citationId,
    label: label ?? citation?.title ?? citationId,
    authorityClass,
    rationale,
  };
}

/**
 * Best-effort mapping from legacy factor-level `evidenceCitation` prose to registry ids.
 *
 * @param evidenceCitation - Free-text citation from AIIE factors.
 */
export function mapEvidenceCitationToCitationId(evidenceCitation: string): {
  citationId: string;
  authorityClass: AuthorityClass;
  needsClinicianVerification: boolean;
} {
  const text = evidenceCitation.toLowerCase();
  if (text.includes("low back") || text.includes("lumbar")) {
    return {
      citationId: "doi:10.1016/j.jacr.2022.02.018",
      authorityClass: "guideline",
      needsClinicianVerification: false,
    };
  }
  if (text.includes("choosing wisely") || text.includes("redundant imaging")) {
    return {
      citationId: "acr:duplicate-imaging-90d",
      authorityClass: "guideline",
      needsClinicianVerification: false,
    };
  }
  if (text.includes("acr") || text.includes("appropriateness")) {
    return {
      citationId: "acr:duplicate-imaging-90d",
      authorityClass: "guideline",
      needsClinicianVerification: true,
    };
  }
  return {
    citationId: "context_dependent",
    authorityClass: "context_dependent",
    needsClinicianVerification: true,
  };
}

/**
 * Maps the first {@link OveruseRule.citations} string to a registry id (best effort).
 *
 * @param citation - Plain-text guideline line from overuse rules.
 */
export function mapOveruseCitationToCitationId(citation: string): {
  citationId: string;
  authorityClass: AuthorityClass;
} {
  const text = citation.toLowerCase();
  if (text.includes("low back")) {
    return { citationId: "doi:10.1016/j.jacr.2022.02.018", authorityClass: "guideline" };
  }
  if (text.includes("choosing wisely")) {
    return { citationId: "choosing-wisely:imaging-stat", authorityClass: "guideline" };
  }
  if (text.includes("acr")) {
    return { citationId: "acr:duplicate-imaging-90d", authorityClass: "guideline" };
  }
  return { citationId: "context_dependent", authorityClass: "context_dependent" };
}

/**
 * Derives {@link MedicalBasis} from the AIIE factor with the largest |contribution|.
 *
 * @param factors - SHAP-style factors on the active score.
 */
export function medicalBasisFromDominantFactor(
  factors: { name: string; contribution: number; evidenceCitation: string }[],
): MedicalBasis {
  const sorted = [...factors].sort(
    (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution),
  );
  const dominant = sorted[0];
  if (!dominant) {
    return medicalBasisFromCitation(
      "context_dependent",
      "context_dependent",
      "AIIE scoring did not attach factor-level citations for this order. // TODO(clinical-signoff)",
      "AIIE clinical factors",
    );
  }
  const mapped = mapEvidenceCitationToCitationId(dominant.evidenceCitation);
  const verifyNote = mapped.needsClinicianVerification ?
    " // TODO(clinical-signoff): map factor evidenceCitation to canonical citationId"
  : "";
  return {
    citationId: mapped.citationId,
    label: dominant.name,
    authorityClass: mapped.authorityClass,
    rationale: `${dominant.name} (SHAP ${dominant.contribution > 0 ? "+" : ""}${dominant.contribution.toFixed(2)}): ${dominant.evidenceCitation}.${verifyNote}`,
  };
}

/**
 * Validates that a {@link MedicalBasis} satisfies playbook requirements.
 * Call at card-build time in Phase 2; not invoked on module import.
 *
 * @param basis - Medical basis to validate.
 * @throws When required fields are missing or invalid.
 */
export function assertMedicalBasis(basis: MedicalBasis | undefined): asserts basis is MedicalBasis {
  if (!basis) {
    throw new Error("CDS card is missing required medicalBasis");
  }
  if (!basis.citationId.trim()) {
    throw new Error("medicalBasis.citationId must be non-empty");
  }
  if (!basis.label.trim()) {
    throw new Error("medicalBasis.label must be non-empty");
  }
  if (!basis.rationale.trim()) {
    throw new Error("medicalBasis.rationale must be non-empty");
  }
  if (!AUTHORITY_CLASSES.includes(basis.authorityClass)) {
    throw new Error(`medicalBasis.authorityClass is invalid: ${basis.authorityClass}`);
  }
  if (basis.citationId !== "context_dependent" && !CITATIONS[basis.citationId]) {
    throw new Error(`medicalBasis.citationId is not registered: ${basis.citationId}`);
  }
  if (basis.authorityClass === "context_dependent") {
    const words = basis.rationale.trim().split(/\s+/).length;
    if (words < 10) {
      throw new Error("context_dependent medicalBasis.rationale must be at least 10 words");
    }
  }
}
