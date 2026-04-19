import { describeImagingCpt } from "@/lib/aiie/cpt-pricing";

/**
 * Good Faith Estimate payload aligned with CMS transparency expectations for uninsured/self-pay.
 * ARKA-INS auto-generates this block; ordering clinicians and facilities retain final liability.
 */
export interface GoodFaithEstimateBlock {
  providerName: string;
  providerNPI: string;
  providerTIN: string;
  servicesProvided: Array<{ cptCode: string; description: string }>;
  diagnosisCodes: string[];
  expectedChargesItemized: Array<{
    code: string;
    description: string;
    chargeUsd: number;
  }>;
  /** CMS-required consumer disclosure language for Good Faith Estimates. */
  disclaimerText: string;
  issueDate: string;
  validFor: string;
}

const GFE_VALID_FOR = "72 hours for scheduled services" as const;

/**
 * Builds a Good Faith Estimate block for API responses.
 *
 * @param params - Provider identifiers, procedure, diagnoses, and expected charges.
 */
export function buildGoodFaithEstimateBlock(params: {
  providerName: string;
  providerNPI: string;
  providerTIN: string;
  cptCode: string;
  diagnosisCodes: string[];
  expectedChargeUsd: number;
  issueDateIso: string;
}): GoodFaithEstimateBlock {
  const description = describeImagingCpt(params.cptCode);
  return {
    providerName: params.providerName,
    providerNPI: params.providerNPI,
    providerTIN: params.providerTIN,
    servicesProvided: [{ cptCode: params.cptCode, description }],
    diagnosisCodes: params.diagnosisCodes,
    expectedChargesItemized: [
      {
        code: params.cptCode,
        description,
        chargeUsd: Math.round(params.expectedChargeUsd * 100) / 100,
      },
    ],
    disclaimerText: cmsGoodFaithEstimateDisclaimer(),
    issueDate: params.issueDateIso,
    validFor: GFE_VALID_FOR,
  };
}

/**
 * Required CMS disclosure elements for a Good Faith Estimate (uninsured/self-pay).
 * Source: 45 CFR 149.610 and related CMS guidance on Good Faith Estimates.
 */
function cmsGoodFaithEstimateDisclaimer(): string {
  return (
    "This Good Faith Estimate shows the costs that are reasonably expected for the items or services " +
    "listed. It is based on information known at the time the estimate was created. " +
    "This Good Faith Estimate is not a contract and does not obligate you to obtain any items or services " +
    "from any specific provider or facility. " +
    "The expected charges could change if additional items or services are recommended as part of your care " +
    "or if information was missing or inaccurate at the time of this estimate. " +
    "If you are billed substantially more than this Good Faith Estimate, you may have rights under federal law " +
    "to dispute the bill. Keep a copy of this Good Faith Estimate in a safe place. " +
    "For questions or more information about your right to a Good Faith Estimate or the dispute process, " +
    "visit www.cms.gov/nosurprises or call 1-800-985-3059."
  );
}
