import type { ParsedCoverage } from "@/lib/fhir/coverage";
import type { OOPEstimate } from "@/lib/types/aiie";
import type { CDSCard } from "@/lib/types/cds-hooks";

import { appendFdaDetailDisclaimer, ARKA_INS_CARD_SOURCE, formatUsd } from "@/lib/cards/card-shared";
import { medicalBasisFromCitation } from "@/lib/cds-platform/cds-hooks/medical-basis";

const HDHP_MIN_DEDUCTIBLE_USD = 1600;

function isLikelyHdhp(parsed: ParsedCoverage): boolean {
  return parsed.deductible != null && parsed.deductible >= HDHP_MIN_DEDUCTIBLE_USD;
}

function deductibleMet(parsed: ParsedCoverage, estimate: OOPEstimate): boolean {
  const rem = estimate.deductibleRemaining;
  if (parsed.deductible != null && parsed.deductible > 0) {
    return rem <= 0.01 * parsed.deductible;
  }
  return rem <= 0;
}

function summaryLine(estimate: OOPEstimate, coverage: ParsedCoverage): string {
  const x = formatUsd(estimate.estimatedPatientResponsibility);
  if (coverage.deductible != null && coverage.deductible > 0) {
    const rem = Math.max(0, estimate.deductibleRemaining);
    const pct = Math.round((rem / coverage.deductible) * 100);
    return `Patient responsibility: ${x} (${pct}% deductible remaining)`;
  }
  return `Patient responsibility: ${x} (deductible unknown)`;
}

/**
 * Builds an out-of-pocket transparency CDS card with tables and HDHP context.
 * Caller should attach `/ins/patient/explainer/[orderId]` links when the order id is known.
 *
 * @param estimate - Modeled patient responsibility and plan math.
 * @param coverage - Parsed coverage for deductible context.
 * @returns CDS Hooks card summarizing cost-sharing.
 */
export function buildOOPCard(estimate: OOPEstimate, coverage: ParsedCoverage): CDSCard {
  const hdhp = isLikelyHdhp(coverage);
  const dedNotMet = !deductibleMet(coverage, estimate);
  const allowed = estimate.inNetworkNegotiatedRate;
  const dedRem = Math.max(0, estimate.deductibleRemaining);
  const modeledDedApplied = Math.min(allowed, Math.max(0, estimate.estimatedPatientResponsibility - estimate.copay));
  const afterDed = Math.max(0, allowed - modeledDedApplied);
  const coinsuranceDollars = Math.max(0, estimate.estimatedPatientResponsibility - estimate.copay - modeledDedApplied);

  const cash = estimate.cashPayComparator;
  const cashDelta =
    cash != null && cash > 0 && estimate.estimatedPatientResponsibility > cash ?
      estimate.estimatedPatientResponsibility - cash
    : undefined;

  const consumePct =
    estimate.estimatedPatientResponsibility + dedRem > 0 ?
      Math.round(
        (estimate.estimatedPatientResponsibility /
          (estimate.estimatedPatientResponsibility + dedRem)) *
          100,
      )
    : 0;

  const hdhpBanner =
    hdhp && dedNotMet ?
      `> **HDHP alert:** Patient has ${formatUsd(dedRem)} of deductible remaining. This study would consume about **${consumePct}%** of the remaining deductible trajectory modeled here.\n\n`
    : "";

  const cashSection =
    cash != null && cash > 0 ?
      cashDelta != null && cashDelta > 0 ?
        `**Cash-pay comparator (loss-framed):** You would pay **${formatUsd(cashDelta)} more here** than the lowest listed cash-pay benchmark (${formatUsd(cash)}).\n\n`
      : `**Cash-pay comparator:** Lowest listed cash-pay benchmark ${formatUsd(cash)}.\n\n`
    : "";

  const detailCore = `${hdhpBanner}<details><summary>Cost-sharing breakdown</summary>

| Component | Modeled amount |
| --- | ---: |
| In-network allowed amount | ${formatUsd(allowed)} |
| Copay (imaging row) | ${formatUsd(estimate.copay)} |
| Deductible absorption (approx.) | ${formatUsd(modeledDedApplied)} |
| Coinsurance dollars (approx.) | ${formatUsd(coinsuranceDollars)} |
| **Total patient responsibility** | **${formatUsd(estimate.estimatedPatientResponsibility)}** |
| Deductible remaining (plan trajectory) | ${formatUsd(estimate.deductibleRemaining)} |
| Coinsurance rate | ${Math.round(estimate.coinsurance * 100)}% on ${formatUsd(afterDed)} after deductible |

${cashSection}</details>

<details><summary>Assumptions & confidence</summary>

- **Estimate confidence:** ${Math.round(estimate.confidence * 100)}%
- **Good-faith estimate posture:** ${estimate.goodFaithEstimateCompliant ? "Modeled fields meet the NSA-style completeness checklist." : "Some modeled fields are incomplete; treat as directional."}
${estimate.assumptions.length ? `\n${estimate.assumptions.map((a) => `- ${a}`).join("\n")}` : ""}

</details>

<details><summary>Patient-facing tools</summary>

Use the **Patient explainer** and **Good Faith Estimate** links on this card (added for the active order) so the patient sees plain-language cost context.

</details>`;

  return {
    uuid: "arka-ins-oop",
    summary: summaryLine(estimate, coverage),
    detail: appendFdaDetailDisclaimer(detailCore),
    indicator: "info",
    source: { ...ARKA_INS_CARD_SOURCE },
    medicalBasis: medicalBasisFromCitation(
      "acr:price-transparency",
      "cms_lcd",
      "Patient out-of-pocket estimates are derived from in-network allowed amounts, deductible remaining, and coinsurance under the CMS Hospital Price Transparency and No Surprises Act good-faith estimate framework so clinicians can counsel on cost before scheduling. // TODO(clinical-signoff)",
      "CMS price transparency — patient responsibility",
    ),
  };
}
