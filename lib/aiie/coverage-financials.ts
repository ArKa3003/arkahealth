import type { ParsedCoverage } from "@/lib/fhir/coverage";
import type { AIIECoverage, AIIECoverageFinancials } from "@/lib/types/aiie";
import type { Coverage } from "@/lib/types/fhir";

import { estimatedInNetworkAllowedForCpt } from "@/lib/aiie/cpt-pricing";

/**
 * Maps parsed FHIR coverage plus CPT context into AIIE financial fields for OOP estimation.
 *
 * @param parsed - Output of {@link parseCoverage}.
 * @param coverage - Raw FHIR Coverage when available (for identifiers).
 * @param cptCode - Ordered CPT used to infer an allowed amount when not otherwise known.
 */
export function coverageFinancialsFromParsed(
  parsed: ParsedCoverage,
  coverage: Coverage | undefined,
  cptCode: string,
): AIIECoverage & AIIECoverageFinancials {
  const coinsuranceFrac =
    parsed.coinsurancePct != null ? Math.min(1, Math.max(0, parsed.coinsurancePct / 100)) : 0.2;
  const dedRem = parsed.deductibleRemaining ?? parsed.deductible ?? 0;
  const copay = parsed.copayImaging ?? 0;
  const allowed = estimatedInNetworkAllowedForCpt(cptCode);
  return {
    coverageId: coverage?.id,
    payerId: parsed.payerId,
    payerName: parsed.payerName,
    planName: parsed.planName ?? parsed.planId,
    productType: undefined,
    priorAuthRequired: undefined,
    deductibleRemaining: Math.max(0, dedRem),
    coinsurance: coinsuranceFrac,
    copay: Math.max(0, copay),
    inNetworkNegotiatedRate: allowed,
  };
}
