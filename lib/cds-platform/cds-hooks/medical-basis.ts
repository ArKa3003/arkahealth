import { CITATIONS, getCitation, tryGetCitation } from '@/lib/cds-platform/citations';
import { evidenceUrl } from '@/lib/evidence/url';
import type { MatchTier, ResolvedRating } from '@/lib/aiie/knowledge-matrix';
import {
  MATRIX_VERSION,
  resolveMatrixForScenario,
} from '@/lib/cds-platform/cds-hooks/matrix-bridge';
import type { ClinicalScenario } from '@/lib/cds-platform/types';

/**
 * Authority tier for the evidence underlying a CDS recommendation (Appendix A).
 */
export type AuthorityClass =
  | 'guideline'
  | 'specialty_society'
  | 'systematic_review'
  | 'rct'
  | 'fda_labeling'
  | 'cms_lcd'
  | 'uspstf'
  | 'choosing_wisely'
  /** @deprecated Legacy Phase 1.5 value — maps to peer-reviewed literature. */
  | 'peer_reviewed'
  /** @deprecated Legacy Phase 1.5 value. */
  | 'ncd_lcd'
  /** @deprecated Legacy Phase 1.5 value. */
  | 'regulatory'
  /** Context-specific clinical judgment without a single canonical citation. */
  | 'context_dependent';

const AUTHORITY_CLASSES: readonly AuthorityClass[] = [
  'guideline',
  'specialty_society',
  'systematic_review',
  'rct',
  'fda_labeling',
  'cms_lcd',
  'uspstf',
  'choosing_wisely',
  'peer_reviewed',
  'ncd_lcd',
  'regulatory',
  'context_dependent',
];

const DEFAULT_LAST_CLINICAL_REVIEW_ISO = '2026-05-24';

/** Prefix for citation ids resolved through the AIIE Clinical Knowledge Matrix. */
export const MATRIX_CITATION_PREFIX = 'matrix:';

/**
 * Structured medical basis attached to every CDS card (playbook Appendix A).
 */
export interface MedicalBasis {
  label: string;
  rationale: string;
  citationId: string;
  url: string;
  authorityClass: AuthorityClass;
  lastClinicalReviewISO: string;
  /** Knowledge Matrix evidence slug when the basis resolved through the matrix. */
  evidenceSlug?: string;
  /** Matrix resolution tier when the basis resolved through the matrix. */
  matchTier?: MatchTier;
}

function citationLabel(citationId: string): string {
  const citation = tryGetCitation(citationId);
  return citation?.label ?? citation?.title ?? citationId;
}

function citationUrl(citationId: string): string {
  if (citationId === 'context_dependent') {
    return CITATIONS.context_dependent.url;
  }
  try {
    return getCitation(citationId).url;
  } catch {
    return CITATIONS.context_dependent.url;
  }
}

/**
 * Builds a {@link MedicalBasis} from a known citation id and rationale text.
 *
 * @param citationId - Key in {@link CITATIONS}.
 * @param authorityClass - Authority tier for the source.
 * @param rationale - Clinician-facing rationale (≥ 40 characters for FDA Criterion 2).
 * @param label - Display label (defaults to citation label when omitted).
 */
export function medicalBasisFromCitation(
  citationId: string,
  authorityClass: AuthorityClass,
  rationale: string,
  label?: string,
): MedicalBasis {
  const resolvedLabel = label ?? citationLabel(citationId);
  return {
    citationId,
    label: resolvedLabel,
    authorityClass,
    rationale,
    url: citationUrl(citationId),
    lastClinicalReviewISO: DEFAULT_LAST_CLINICAL_REVIEW_ISO,
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
  if (text.includes('low back') || text.includes('lumbar')) {
    return {
      citationId: 'doi:10.1016/j.jacr.2022.02.018',
      authorityClass: 'guideline',
      needsClinicianVerification: false,
    };
  }
  if (text.includes('choosing wisely') || text.includes('redundant imaging')) {
    return {
      citationId: 'acr:duplicate-imaging-90d',
      authorityClass: 'guideline',
      needsClinicianVerification: false,
    };
  }
  if (text.includes('acr') || text.includes('appropriateness')) {
    return {
      citationId: 'acr:duplicate-imaging-90d',
      authorityClass: 'guideline',
      needsClinicianVerification: true,
    };
  }
  return {
    citationId: 'context_dependent',
    authorityClass: 'context_dependent',
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
  if (text.includes('low back')) {
    return { citationId: 'doi:10.1016/j.jacr.2022.02.018', authorityClass: 'guideline' };
  }
  if (text.includes('choosing wisely')) {
    return { citationId: 'choosing-wisely:imaging-stat', authorityClass: 'choosing_wisely' };
  }
  if (text.includes('acr')) {
    return { citationId: 'acr:duplicate-imaging-90d', authorityClass: 'guideline' };
  }
  return { citationId: 'context_dependent', authorityClass: 'context_dependent' };
}

/**
 * Builds a {@link MedicalBasis} from a resolved AIIE Clinical Knowledge Matrix rating.
 * Tier-4 (conservative_default) yields the indeterminate-order basis whose rationale
 * carries documentation guidance — there is no dead-end path.
 *
 * @param resolved - Output of the matrix four-tier resolution cascade.
 */
export function medicalBasisFromMatrix(resolved: ResolvedRating): MedicalBasis {
  const slug = resolved.rating.evidenceSlug;
  const rawRationale = resolved.rating.rationale.trim();
  const rationale =
    rawRationale.length >= 40
      ? rawRationale
      : `${rawRationale} Documenting indication, duration, and red-flag status enables a scenario-level appropriateness rating.`;
  return {
    label: `${resolved.scenario.name} — AIIE Clinical Knowledge Matrix v${MATRIX_VERSION}`,
    rationale,
    citationId: `${MATRIX_CITATION_PREFIX}${slug}`,
    url: evidenceUrl(slug),
    authorityClass: 'guideline',
    lastClinicalReviewISO: DEFAULT_LAST_CLINICAL_REVIEW_ISO,
    evidenceSlug: slug,
    matchTier: resolved.matchTier,
  };
}

/**
 * Derives guideline-anchored {@link MedicalBasis} from the clinical scenario (primary FDA
 * Criterion 2 source). Resolves through the AIIE Clinical Knowledge Matrix evidence slug and
 * ALWAYS returns a basis: tier-4 falls back to the indeterminate-order basis with
 * documentation guidance rather than a dead-end.
 *
 * @param scenario - Mapped prefetch + draft order context.
 */
export function medicalBasisFromScenario(scenario: ClinicalScenario): MedicalBasis {
  return medicalBasisFromMatrix(resolveMatrixForScenario(scenario));
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
      'context_dependent',
      'context_dependent',
      'AIIE scoring did not attach factor-level citations for this order. Clinician judgment and chart context should govern the final imaging decision.',
      'AIIE clinical factors',
    );
  }
  const mapped = mapEvidenceCitationToCitationId(dominant.evidenceCitation);
  const verifyNote = mapped.needsClinicianVerification ?
    ' Clinical sign-off may be required to map factor evidence to a canonical citation.'
  : '';
  const rationale =
    `${dominant.name} (SHAP ${dominant.contribution > 0 ? '+' : ''}${dominant.contribution.toFixed(2)}): ${dominant.evidenceCitation}.${verifyNote}`;
  return medicalBasisFromCitation(
    mapped.citationId,
    mapped.authorityClass,
    rationale.length >= 40 ?
      rationale
    : `${rationale} Evidence linkage supports appropriateness review per institutional policy.`,
    dominant.name,
  );
}

/**
 * Validates that a value satisfies FDA Non-Device CDS Criterion 2 (medical basis).
 *
 * @param b - Candidate medical basis object.
 * @throws With prefix `FDA Criterion 2 violation:` when invalid.
 */
export function assertMedicalBasis(b: unknown): asserts b is MedicalBasis {
  if (!b || typeof b !== 'object') {
    throw new Error('FDA Criterion 2 violation: medicalBasis is missing or not an object');
  }

  const basis = b as Partial<MedicalBasis>;

  if (!basis.label || typeof basis.label !== 'string' || !basis.label.trim()) {
    throw new Error('FDA Criterion 2 violation: medicalBasis.label is required');
  }
  if (!basis.citationId || typeof basis.citationId !== 'string' || !basis.citationId.trim()) {
    throw new Error('FDA Criterion 2 violation: medicalBasis.citationId is required');
  }
  if (!basis.url || typeof basis.url !== 'string' || !basis.url.trim()) {
    throw new Error('FDA Criterion 2 violation: medicalBasis.url is required');
  }
  if (
    !basis.lastClinicalReviewISO ||
    typeof basis.lastClinicalReviewISO !== 'string' ||
    !basis.lastClinicalReviewISO.trim()
  ) {
    throw new Error('FDA Criterion 2 violation: medicalBasis.lastClinicalReviewISO is required');
  }
  if (!basis.authorityClass || !AUTHORITY_CLASSES.includes(basis.authorityClass)) {
    throw new Error(
      `FDA Criterion 2 violation: medicalBasis.authorityClass is invalid (${String(basis.authorityClass)})`,
    );
  }
  if (!basis.rationale || typeof basis.rationale !== 'string' || !basis.rationale.trim()) {
    throw new Error('FDA Criterion 2 violation: medicalBasis.rationale is required');
  }
  if (basis.rationale.trim().length < 40) {
    throw new Error(
      'FDA Criterion 2 violation: medicalBasis.rationale must be at least 40 characters',
    );
  }
  if (basis.citationId.startsWith(MATRIX_CITATION_PREFIX)) {
    const slug = basis.citationId.slice(MATRIX_CITATION_PREFIX.length);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error(
        `FDA Criterion 2 violation: matrix citationId has an invalid evidence slug (${basis.citationId})`,
      );
    }
  } else if (basis.citationId !== 'context_dependent' && !CITATIONS[basis.citationId]) {
    throw new Error(
      `FDA Criterion 2 violation: medicalBasis.citationId is not registered (${basis.citationId})`,
    );
  }
}
