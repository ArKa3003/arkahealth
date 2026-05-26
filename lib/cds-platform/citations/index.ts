/**
 * Canonical citation registry for CDS `medicalBasis.citationId` references.
 * Seeded per ARKA CDS Hooks unified playbook Appendix A.
 */

import type { AuthorityClass } from '@/lib/cds-platform/cds-hooks/medical-basis';

/** A published or regulatory source referenced by CDS cards. */
export interface Citation {
  id: string;
  /** Human-readable title (Appendix A `label`). */
  label: string;
  /** @deprecated Prefer {@link Citation.label}. */
  title?: string;
  url: string;
  authorityClass: AuthorityClass;
  year: number;
  /** ISO date (YYYY-MM-DD) when the URL was last verified. */
  lastVerifiedISO: string;
}

const LAST_VERIFIED = '2026-05-24';

/**
 * Registry of citations available to INS and platform card builders.
 * Keys match {@link Citation.id}.
 */
export const CITATIONS: Record<string, Citation> = {
  'doi:10.1016/j.jacr.2022.02.018': {
    id: 'doi:10.1016/j.jacr.2022.02.018',
    label: 'Imaging appropriateness criteria — Low Back Pain (2022)',
    title: 'Imaging appropriateness criteria — Low Back Pain (2022)',
    url: 'https://doi.org/10.1016/j.jacr.2022.02.018',
    authorityClass: 'guideline',
    year: 2022,
    lastVerifiedISO: LAST_VERIFIED,
  },
  'acr:duplicate-imaging-90d': {
    id: 'acr:duplicate-imaging-90d',
    label: 'Imaging appropriateness criteria — repeat imaging within 90 days',
    title: 'Imaging appropriateness criteria — repeat imaging within 90 days',
    url: 'https://acsearch.acr.org/list',
    authorityClass: 'guideline',
    year: 2023,
    lastVerifiedISO: LAST_VERIFIED,
  },
  'acr:price-transparency': {
    id: 'acr:price-transparency',
    label: 'CMS Hospital Price Transparency Rule',
    title: 'CMS Hospital Price Transparency Rule',
    url: 'https://www.cms.gov/priorities/key-initiatives/hospital-price-transparency',
    authorityClass: 'cms_lcd',
    year: 2021,
    lastVerifiedISO: LAST_VERIFIED,
  },
  'choosing-wisely:imaging-stat': {
    id: 'choosing-wisely:imaging-stat',
    label: 'Choosing Wisely — avoid inappropriate STAT imaging',
    title: 'Choosing Wisely — avoid inappropriate STAT imaging',
    url: 'https://www.choosingwisely.org/clinician-lists/',
    authorityClass: 'choosing_wisely',
    year: 2024,
    lastVerifiedISO: LAST_VERIFIED,
  },
  'hl7:davinci-crd': {
    id: 'hl7:davinci-crd',
    label: 'HL7 Da Vinci CRD Implementation Guide',
    title: 'HL7 Da Vinci CRD Implementation Guide',
    url: 'http://hl7.org/fhir/uv/crd/',
    authorityClass: 'guideline',
    year: 2024,
    lastVerifiedISO: LAST_VERIFIED,
  },
  'cms:gold-card-medicare-advantage': {
    id: 'cms:gold-card-medicare-advantage',
    label: 'CMS Medicare Advantage prior authorization gold-carding',
    title: 'CMS Medicare Advantage prior authorization gold-carding',
    // TODO(clinical-signoff): URL needs clinical-team verification
    url: 'https://www.cms.gov/newsroom/fact-sheets/cms-finalizes-rule-expand-access-health-information-improve-prior',
    authorityClass: 'cms_lcd',
    year: 2024,
    lastVerifiedISO: LAST_VERIFIED,
  },
  context_dependent: {
    id: 'context_dependent',
    label: 'Context-dependent clinical judgment',
    title: 'Context-dependent clinical judgment',
    url: 'https://www.getarka.health/docs/feature-catalog',
    authorityClass: 'context_dependent',
    year: 2026,
    lastVerifiedISO: '2026-05-26',
  },
  'arka:context': {
    id: 'arka:context',
    label: 'ARKA context-dependent feature (not guideline-anchored)',
    url: 'https://www.getarka.health/docs/feature-catalog',
    authorityClass: 'context_dependent',
    year: 2026,
    lastVerifiedISO: '2026-05-26',
  },
  'acr:ped-rlq-pain': {
    id: 'acr:ped-rlq-pain',
    label: 'Imaging appropriateness criteria — Right Lower Quadrant Pain, Pediatric (2023)',
    url: 'https://acsearch.acr.org/docs/6948342/Narrative/',
    authorityClass: 'guideline',
    year: 2023,
    lastVerifiedISO: LAST_VERIFIED,
  },
  'uspstf:lbp-imaging': {
    id: 'uspstf:lbp-imaging',
    label: 'USPSTF / Choosing Wisely on imaging for low back pain',
    url: 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/low-back-pain-adults-interventions',
    authorityClass: 'uspstf',
    year: 2024,
    lastVerifiedISO: LAST_VERIFIED,
  },
  'acr:knee-oa': {
    id: 'acr:knee-oa',
    label: 'Imaging appropriateness criteria — Chronic Knee Pain (2022)',
    url: 'https://acsearch.acr.org/docs/6948394/Narrative/',
    authorityClass: 'guideline',
    year: 2022,
    lastVerifiedISO: LAST_VERIFIED,
  },
  'acr:sudden-headache': {
    id: 'acr:sudden-headache',
    label: 'Imaging appropriateness criteria — Headache (2019)',
    url: 'https://acsearch.acr.org/docs/6948396/Narrative/',
    authorityClass: 'guideline',
    year: 2019,
    lastVerifiedISO: LAST_VERIFIED,
  },
  // TODO(clinical-signoff): confirm narrative URL with clinical team
  'acr:head-trauma': {
    id: 'acr:head-trauma',
    label: 'Imaging appropriateness criteria — Head Trauma (2020 revision)',
    url: 'https://acsearch.acr.org/docs/3083021/Narrative/',
    authorityClass: 'guideline',
    year: 2020,
    lastVerifiedISO: LAST_VERIFIED,
  },
  'acr:contrast-media-manual': {
    id: 'acr:contrast-media-manual',
    label: 'Published contrast-media safety manual (2024)',
    url: 'https://www.acr.org/Clinical-Resources/Contrast-Manual',
    authorityClass: 'guideline',
    year: 2024,
    lastVerifiedISO: LAST_VERIFIED,
  },
};

/**
 * Returns a citation entry when registered.
 *
 * @param citationId - Stable citation identifier.
 * @throws When the citation id is not in {@link CITATIONS}.
 */
export function getCitation(citationId: string): Citation {
  const citation = CITATIONS[citationId];
  if (!citation) {
    throw new Error(`Unknown citation id: ${citationId}`);
  }
  return citation;
}

/**
 * Returns a citation when registered, otherwise `undefined` (legacy callers).
 *
 * @param citationId - Stable citation identifier.
 */
export function tryGetCitation(citationId: string): Citation | undefined {
  return CITATIONS[citationId];
}
