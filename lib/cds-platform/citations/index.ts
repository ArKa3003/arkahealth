/**
 * Canonical citation registry for CDS `medicalBasis.citationId` references.
 * Seeded per ARKA CDS Hooks unified playbook Appendix A.
 */

/** A published or regulatory source referenced by CDS cards. */
export interface Citation {
  /** Stable citation identifier (e.g. `doi:…`, `acr:…`, `cms:…`). */
  id: string;
  /** Human-readable title. */
  title: string;
  /** Canonical URL for the source document. */
  url: string;
  /** Publication or effective year. */
  year: number;
  /** ISO date (YYYY-MM-DD) when the URL was last verified. */
  lastVerifiedISO: string;
}

const LAST_VERIFIED = "2026-05-23";

/**
 * Registry of citations available to INS and platform card builders.
 * Keys match {@link Citation.id}.
 */
export const CITATIONS: Record<string, Citation> = {
  "doi:10.1016/j.jacr.2022.02.018": {
    id: "doi:10.1016/j.jacr.2022.02.018",
    title: "ACR Appropriateness Criteria — Low Back Pain (2022)",
    url: "https://doi.org/10.1016/j.jacr.2022.02.018",
    year: 2022,
    lastVerifiedISO: LAST_VERIFIED,
  },
  "acr:duplicate-imaging-90d": {
    id: "acr:duplicate-imaging-90d",
    title: "ACR Appropriateness Criteria — repeat imaging within 90 days",
    url: "https://acsearch.acr.org/list",
    year: 2023,
    lastVerifiedISO: LAST_VERIFIED,
  },
  "acr:price-transparency": {
    id: "acr:price-transparency",
    title: "CMS Hospital Price Transparency Rule",
    url: "https://www.cms.gov/priorities/key-initiatives/hospital-price-transparency",
    year: 2021,
    lastVerifiedISO: LAST_VERIFIED,
  },
  "choosing-wisely:imaging-stat": {
    id: "choosing-wisely:imaging-stat",
    title: "Choosing Wisely — avoid inappropriate STAT imaging",
    url: "https://www.choosingwisely.org/clinician-lists/",
    year: 2024,
    lastVerifiedISO: LAST_VERIFIED,
  },
  "hl7:davinci-crd": {
    id: "hl7:davinci-crd",
    title: "HL7 Da Vinci CRD Implementation Guide",
    url: "http://hl7.org/fhir/uv/crd/",
    year: 2024,
    lastVerifiedISO: LAST_VERIFIED,
  },
  "cms:gold-card-medicare-advantage": {
    id: "cms:gold-card-medicare-advantage",
    title: "CMS Medicare Advantage prior authorization gold-carding",
    // TODO(clinical-signoff): URL needs clinical-team verification
    url: "https://www.cms.gov/newsroom/fact-sheets/cms-finalizes-rule-expand-access-health-information-improve-prior",
    year: 2024,
    lastVerifiedISO: LAST_VERIFIED,
  },
  "context_dependent": {
    id: "context_dependent",
    title: "Context-dependent clinical judgment",
    url: "https://arkahealth.com/methodology",
    year: 2026,
    lastVerifiedISO: LAST_VERIFIED,
  },
};

/**
 * Returns a citation entry when registered.
 *
 * @param citationId - Stable citation identifier.
 */
export function getCitation(citationId: string): Citation | undefined {
  return CITATIONS[citationId];
}
