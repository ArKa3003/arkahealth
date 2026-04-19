import type { RuralExemption } from "../types";

/**
 * Database of known rural payer exemptions.
 * In production this would be a maintained database updated
 * as payer policies change. For the demo, these represent
 * realistic exemptions based on actual payer policies.
 */
export const RURAL_EXEMPTIONS: RuralExemption[] = [
  {
    id: "ex-001",
    payerId: "medicare",
    payerName: "Medicare",
    exemptionType: "critical-access-exemption",
    eligibleDesignations: ["CAH"],
    description:
      "Critical Access Hospitals are exempt from certain outpatient imaging prior authorization requirements under Medicare",
    requirements: ["Active CAH designation", "Located in rural area per Census definition"],
    effectiveDate: "2024-01-01",
    documentationRequired: ["CAH certification letter", "CMS Certification Number"],
    estimatedTimeSavedMinutes: 45,
    autoDetectable: true,
  },
  {
    id: "ex-002",
    payerId: "medicare",
    payerName: "Medicare",
    exemptionType: "reh-exemption",
    eligibleDesignations: ["REH"],
    description:
      "Rural Emergency Hospitals receive streamlined prior authorization for outpatient imaging services as part of the REH program",
    requirements: ["Active REH conversion", "Maintaining required outpatient services"],
    effectiveDate: "2023-01-01",
    documentationRequired: ["REH enrollment confirmation", "CMS provider number"],
    estimatedTimeSavedMinutes: 30,
    autoDetectable: true,
  },
  {
    id: "ex-003",
    payerId: "bcbs-ks",
    payerName: "Blue Cross Blue Shield of Kansas",
    exemptionType: "travel-distance-exception",
    eligibleDesignations: ["CAH", "REH", "RHC", "HPSA"],
    description:
      "When patient must travel >50 miles for an imaging study, BCBS-KS allows an alternative study at the local facility without standard prior authorization",
    requirements: [
      "Patient resides >50 miles from nearest facility with required modality",
      "Clinical justification for imaging",
    ],
    effectiveDate: "2025-07-01",
    documentationRequired: ["Patient address verification", "Distance calculation", "Clinical justification note"],
    estimatedTimeSavedMinutes: 60,
    autoDetectable: true,
  },
  {
    id: "ex-004",
    payerId: "aetna",
    payerName: "Aetna",
    exemptionType: "gold-card-rural",
    eligibleDesignations: ["CAH", "REH", "RHC"],
    description:
      "Rural facilities with imaging denial rates below 5% for 12 consecutive months qualify for Gold Card status, waiving prior authorization for routine imaging",
    requirements: ["Denial rate <5% for 12 months", "Minimum 50 imaging orders in period", "Rural facility designation"],
    effectiveDate: "2025-01-01",
    documentationRequired: ["Denial rate report", "Imaging volume report"],
    estimatedTimeSavedMinutes: 40,
    autoDetectable: true,
  },
  {
    id: "ex-005",
    payerId: "medicaid-ks",
    payerName: "Kansas Medicaid (KanCare)",
    exemptionType: "emergency-bypass",
    eligibleDesignations: ["CAH", "REH"],
    description:
      "Emergency imaging at CAH/REH facilities does not require prior authorization under KanCare. Retrospective review within 72 hours.",
    requirements: ["Emergency department presentation", "Provider attestation of emergency"],
    effectiveDate: "2024-06-01",
    documentationRequired: ["ED encounter note", "Provider emergency attestation"],
    estimatedTimeSavedMinutes: 90,
    autoDetectable: true,
  },
  {
    id: "ex-006",
    payerId: "uhc",
    payerName: "UnitedHealthcare",
    exemptionType: "modified-criteria",
    eligibleDesignations: ["CAH", "REH", "HPSA", "MUA"],
    description:
      "UHC applies modified clinical criteria for facilities in HPSAs and MUAs, accepting alternative imaging modalities when the standard modality is unavailable locally",
    requirements: ["Facility in HPSA or MUA", "Documentation of modality unavailability", "Clinical justification for alternative"],
    effectiveDate: "2025-03-01",
    documentationRequired: ["HPSA/MUA designation proof", "Equipment inventory", "Alternative study justification"],
    estimatedTimeSavedMinutes: 35,
    autoDetectable: true,
  },
];

/**
 * Detect applicable exemptions for a given facility.
 */
export function detectApplicableExemptions(
  facilityDesignations: string[],
  payerIds?: string[]
): RuralExemption[] {
  return RURAL_EXEMPTIONS.filter((ex) => {
    const hasEligibleDesignation = ex.eligibleDesignations.some((d) => facilityDesignations.includes(d));
    if (!hasEligibleDesignation) return false;

    if (payerIds && payerIds.length > 0) {
      return payerIds.includes(ex.payerId);
    }

    return true;
  });
}
