import type { CDSCard } from "@/lib/types/cds-hooks";

import {
  appendFdaDetailDisclaimer,
  ARKA_INS_CARD_SOURCE,
  formatUsd,
  noopSuggestionActions,
} from "@/lib/cards/card-shared";
import { medicalBasisFromCitation } from "@/lib/cds-platform/cds-hooks/medical-basis";

/** Shoppable imaging site row used for site-shopping CDS content. */
export interface ShoppableSite {
  /** Stable site identifier. */
  id: string;
  /** Display name. */
  name: string;
  /** One-way road distance when known. */
  distanceMiles?: number;
  /** Normalized quality score 0–100 when known. */
  qualityScore?: number;
  /** Estimated wait in days when known. */
  waitTimeDays?: number;
  /** Listed or modeled cash price for the study. */
  cashPrice: number;
}

/** Current ordering facility modeled patient responsibility. */
export interface CurrentSiteCost {
  /** Facility label shown to the clinician. */
  name: string;
  /** Estimated patient responsibility at the current site. */
  estimatedPatientResponsibility: number;
}

const REROUTE_UUID = "c1111111-1111-4111-8111-111111111101";

/**
 * Builds a loss-framed alternative-site CDS card when savings clear financial thresholds.
 *
 * @param currentSite - Modeled responsibility at the ordering facility.
 * @param alternatives - Candidate shoppable sites for the procedure.
 * @returns A CDS card, or `null` when savings are below policy thresholds.
 */
export function buildAlternativeSiteCard(
  currentSite: CurrentSiteCost,
  alternatives: ShoppableSite[],
): CDSCard | null {
  const current = currentSite.estimatedPatientResponsibility;
  if (!alternatives.length || current <= 0) {
    return null;
  }
  const sorted = [...alternatives].filter((s) => s.cashPrice > 0).sort((a, b) => a.cashPrice - b.cashPrice);
  if (!sorted.length) {
    return null;
  }
  const top = sorted[0];
  const delta = current - top.cashPrice;
  const pct = delta / current;
  if (!(pct > 0.2 && delta > 150)) {
    return null;
  }

  const topThree = sorted.slice(0, 3);
  const rows = topThree
    .map((s, i) => {
      const dist = s.distanceMiles != null ? `${s.distanceMiles} mi` : "—";
      const qual = s.qualityScore != null ? `${s.qualityScore}/100` : "—";
      const wait = s.waitTimeDays != null ? `${s.waitTimeDays} d` : "—";
      return `| ${i + 1} | ${s.name} | ${dist} | ${qual} | ${wait} | ${formatUsd(s.cashPrice)} |`;
    })
    .join("\n");

  const detailCore = `<details><summary>Why this surfaced</summary>

Loss-framed savings use modeled patient responsibility **here** (${formatUsd(current)}) versus listed cash prices at shoppable alternatives for the same service class.

</details>

<details><summary>Top alternatives</summary>

| Rank | Site | Distance | Quality | Wait | Cash price |
| --- | --- | --- | --- | --- | ---: |
${rows}

</details>`;

  return {
    uuid: "arka-ins-alt-site",
    summary: `Patient would pay ${formatUsd(delta)} more here than at ${top.name}`,
    detail: appendFdaDetailDisclaimer(detailCore),
    indicator: "info",
    source: { ...ARKA_INS_CARD_SOURCE },
    medicalBasis: medicalBasisFromCitation(
      "context_dependent",
      "context_dependent",
      "Site-of-care optimization weighs modeled patient responsibility at the ordering facility against shoppable in-network alternatives with comparable modality and quality signals. When savings exceed policy thresholds, rerouting may reduce out-of-pocket cost without changing the clinical indication. // TODO(clinical-signoff)",
      "Site-of-care cost comparison",
    ),
    selectionBehavior: "at-most-one",
    suggestions: [
      {
        label: `Reroute to ${top.name}`,
        uuid: REROUTE_UUID,
        isRecommended: true,
        actions: noopSuggestionActions(),
      },
    ],
    links: [
      {
        label: `SMART: reroute to ${top.name}`,
        url: "https://arkahealth.com/ins/smart/reroute",
        type: "smart",
        appContext: JSON.stringify({ siteId: top.id, siteName: top.name }),
      },
    ],
  };
}
