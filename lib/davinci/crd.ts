import { buildAlternativeSiteCard } from "@/lib/cards/alternative-site-card";
import type { ShoppableSite } from "@/lib/cards/alternative-site-card";
import { buildCoverageCard, type InsPaHistorySimilarMetrics } from "@/lib/cards/coverage-card";
import { buildGoldCardCard } from "@/lib/cards/gold-card-card";
import { buildOOPCard } from "@/lib/cards/oop-card";
import {
  appendFdaDetailDisclaimer,
  ARKA_INS_CARD_SOURCE,
  ARKA_PUBLIC_SITE_ORIGIN,
  formatUsd,
} from "@/lib/cards/card-shared";
import type { INSAuthorizationBand } from "@/lib/aiie/denial-risk";
import type { ParsedCoverage } from "@/lib/fhir/coverage";
import type { AIIEScore, GoldCardStatus, OOPEstimate } from "@/lib/types/aiie";
import type { CDSCard, CDSOverrideReason } from "@/lib/types/cds-hooks";
import type { Coverage } from "@/lib/types/fhir";

export type { InsPaHistorySimilarMetrics, ShoppableSite };

/** Order identifiers used for explainer links and CPT context. */
export interface CRDOrderContext {
  /** ServiceRequest id or stable order id for URLs. */
  id: string;
  cpt?: string;
}

/** Ordering clinician directory context. */
export interface CRDProviderContext {
  id?: string;
  name: string;
  specialty?: string;
}

/**
 * Inputs required to assemble CRD CDS cards (Prompt 7 ordering: gold → coverage → OOP →
 * alternative site → documentation / DTR).
 */
export interface CRDBuildContext {
  aiie: AIIEScore;
  denialRisk: number;
  action: INSAuthorizationBand;
  goldCard: GoldCardStatus | null;
  oopEstimate: OOPEstimate | null;
  alternatives: ShoppableSite[];
  coverage: ParsedCoverage;
  order: CRDOrderContext;
  provider: CRDProviderContext;
  coverageResource?: Coverage;
  /** Cohort metrics from `ins_pa_history` (e.g., same specialty + CPT + payer). */
  paHistorySimilar?: InsPaHistorySimilarMetrics;
  /** Label for the ordering facility when comparing shoppable alternatives. */
  currentSiteName?: string;
  /** Explicit modeled responsibility at the ordering site (defaults to OOP estimate). */
  currentSitePatientResponsibility?: number;
}

function withPatientCostLinks(card: CDSCard, orderId: string): CDSCard {
  const explainer = `${ARKA_PUBLIC_SITE_ORIGIN}/ins/patient/explainer/${encodeURIComponent(orderId)}`;
  const gfe = `${ARKA_PUBLIC_SITE_ORIGIN}/ins/patient/gfe/${encodeURIComponent(orderId)}`;
  return {
    ...card,
    links: [
      ...(card.links ?? []),
      { label: "Patient explainer", url: explainer, type: "absolute" },
      { label: "Download Good Faith Estimate", url: gfe, type: "absolute" },
    ],
  };
}

function buildDocumentationGapCard(cpt: string, payerId?: string): CDSCard {
  return {
    uuid: "arka-ins-doc-gap",
    summary: "Documentation gap — DTR questionnaire",
    detail: appendFdaDetailDisclaimer(
      `<details><summary>Why this matters</summary>

Denial risk is elevated. Completing a Documentation Templates and Rules (DTR) questionnaire strengthens the PA packet with structured indications, conservative care, and prior imaging details.

</details>`,
    ),
    indicator: "warning",
    source: { ...ARKA_INS_CARD_SOURCE },
    links: [
      {
        label: "Launch DTR questionnaire (SMART)",
        url: "https://arkahealth.com/ins/dtr",
        type: "smart",
        appContext: JSON.stringify({ cpt, payerId }),
      },
    ],
  };
}

/**
 * Assembles CRD CDS Hook cards for ARKA-INS in Prompt 7 priority order.
 *
 * @param context - AIIE, payer, OOP, gold-card, shoppable alternatives, and order metadata.
 * @returns Cards with FDA non-device CDS disclaimers on every `detail` field.
 */
export function buildCRDCards(context: CRDBuildContext): CDSCard[] {
  const cards: CDSCard[] = [];
  const cpt = context.order.cpt ?? "00000";

  if (context.goldCard?.eligible) {
    cards.push(buildGoldCardCard(context.goldCard, context.provider.name, cpt));
  }

  cards.push(
    buildCoverageCard(
      context.aiie,
      context.denialRisk,
      context.action,
      context.coverage,
      context.paHistorySimilar,
    ),
  );

  if (context.oopEstimate) {
    const oopCard = buildOOPCard(context.oopEstimate, context.coverage);
    cards.push(withPatientCostLinks(oopCard, context.order.id));
  }

  const currentName = context.currentSiteName ?? "Ordering facility";
  const currentAmt =
    context.currentSitePatientResponsibility ??
    context.oopEstimate?.estimatedPatientResponsibility ??
    0;
  const altCard = buildAlternativeSiteCard(
    { name: currentName, estimatedPatientResponsibility: currentAmt },
    context.alternatives,
  );
  if (altCard) {
    cards.push(altCard);
  }

  if (context.denialRisk > 6 || context.action === "LIKELY_DENY") {
    cards.push(buildDocumentationGapCard(cpt, context.coverage.payerId));
  }

  return cards;
}

/**
 * Returns a single informational CDS card when AIIE scoring is unavailable.
 */
export function buildCoverageUnavailableCard(): CDSCard {
  return {
    uuid: "arka-ins-coverage-unavailable",
    summary: "Coverage check unavailable",
    detail: appendFdaDetailDisclaimer(
      "Coverage check unavailable — please submit via standard prior authorization workflow.",
    ),
    indicator: "info",
    source: { ...ARKA_INS_CARD_SOURCE },
  };
}

/**
 * Detects whether a completed Documentation Templates and Rules (DTR) questionnaire
 * is present in CDS hook context or prefetch payloads.
 *
 * @param context - CDS `context` object from the hook request.
 * @param prefetch - CDS `prefetch` object from the hook request.
 * @returns True when a completed DTR / QuestionnaireResponse is represented.
 */
export function hasCompletedDtrQuestionnaireInContext(
  context: Record<string, unknown>,
  prefetch: Record<string, unknown>,
): boolean {
  if (context.dtrCompleted === true || context.dtrQuestionnaireCompleted === true) {
    return true;
  }
  const qc = context.dtrQuestionnaireStatus ?? context.questionnaireStatus;
  if (typeof qc === "string" && qc.trim().toLowerCase() === "completed") {
    return true;
  }

  const unwrapQuestionnaireResponse = (obj: unknown): { status?: string } | undefined => {
    if (!obj || typeof obj !== "object") {
      return undefined;
    }
    const o = obj as Record<string, unknown>;
    if (o.resourceType === "QuestionnaireResponse") {
      return o as { status?: string };
    }
    if (o.resourceType === "Bundle" && Array.isArray(o.entry)) {
      for (const e of o.entry) {
        const r = (e as { resource?: unknown }).resource;
        if (
          r &&
          typeof r === "object" &&
          (r as { resourceType?: string }).resourceType === "QuestionnaireResponse"
        ) {
          return r as { status?: string };
        }
      }
    }
    return undefined;
  };

  const prefetchKeys = ["dtrQuestionnaireResponse", "questionnaireResponse", "QuestionnaireResponse"] as const;
  for (const k of prefetchKeys) {
    const qr = unwrapQuestionnaireResponse(prefetch[k]);
    const st = qr?.status?.trim().toLowerCase();
    if (st === "completed") {
      return true;
    }
  }
  return false;
}

const ORDER_SIGN_OVERRIDE_REASONS: CDSOverrideReason[] = [
  {
    code: "dtr-completed-externally",
    display: "DTR questionnaire completed outside this session (document reference available)",
  },
  {
    code: "clinical-urgency",
    display: "Time-sensitive clinical need documented; proceeding without waiting on PA packet",
  },
  {
    code: "alternative-payer-path",
    display: "Alternate coverage or self-pay path confirmed with patient",
  },
];

/**
 * CDS card for `order-sign` when denial risk is high and no DTR completion is on file.
 *
 * @param params - Denial risk, procedure, and payer identifiers for SMART DTR launch.
 * @returns Critical card with override reasons for EHR signature gating.
 */
export function buildOrderSignCriticalBlockCard(params: {
  denialRisk: number;
  cpt: string;
  payerId?: string;
}): CDSCard {
  const { denialRisk, cpt, payerId } = params;
  return {
    uuid: "arka-ins-order-sign-block",
    summary: "Likely denial risk — signature requires override or DTR completion",
    detail: appendFdaDetailDisclaimer(
      `<details><summary>Loss framing — what you may lose by signing now</summary>

At this denial-risk level (**${denialRisk}/9**), proceeding without a completed DTR questionnaire commonly increases **avoidable denials**, **appeal workload**, and **patient delays**. Each avoided denial typically preserves weeks of care progression and staff time that would otherwise go to packet rebuilds.

Complete structured documentation first, or choose an override reason if you are intentionally accepting that tradeoff.

</details>`,
    ),
    indicator: "critical",
    source: { ...ARKA_INS_CARD_SOURCE },
    overrideReasons: [...ORDER_SIGN_OVERRIDE_REASONS],
    links: [
      {
        label: "Complete DTR questionnaire (SMART)",
        url: "https://arkahealth.com/ins/dtr",
        type: "smart",
        appContext: JSON.stringify({ cpt, payerId, flow: "dtr" }),
      },
    ],
  };
}

/**
 * CDS card for `order-sign` when denial risk is low — encourages proactive PA submission.
 *
 * @param params - Procedure, payer, and order identifiers for SMART launch context.
 * @returns Informational confirmation card with a one-click PA / DTR launch.
 */
export function buildOrderSignLowRiskConfirmationCard(params: {
  cpt: string;
  payerId?: string;
  orderId: string;
}): CDSCard {
  const { cpt, payerId, orderId } = params;
  return {
    uuid: "arka-ins-order-sign-confirm",
    summary: "Low modeled denial risk — PA packet is likely payer-ready",
    detail: appendFdaDetailDisclaimer(
      "Modeled denial risk is in the favorable band. Submitting prior authorization now can reduce downstream administrative surprises and keep scheduling aligned with payer timelines.",
    ),
    indicator: "info",
    source: { ...ARKA_INS_CARD_SOURCE },
    links: [
      {
        label: "Submit PA now (SMART)",
        url: "https://arkahealth.com/ins/dtr",
        type: "smart",
        appContext: JSON.stringify({ cpt, payerId, orderId, flow: "pa_submit" }),
      },
    ],
  };
}

/**
 * CDS card for intermediate denial risk at signature time (clinical review band).
 *
 * @param params - Denial risk index and procedure context.
 * @returns Informational card recommending documentation review.
 */
export function buildOrderSignModerateRiskCard(params: { denialRisk: number; cpt: string; payerId?: string }): CDSCard {
  const { denialRisk, cpt, payerId } = params;
  return {
    uuid: "arka-ins-order-sign-review",
    summary: "Moderate modeled denial risk — review PA packet before signing",
    detail: appendFdaDetailDisclaimer(
      `Denial risk is **${denialRisk}/9** (clinical review band). Consider strengthening documentation or running the DTR flow before signature if the schedule allows.`,
    ),
    indicator: "info",
    source: { ...ARKA_INS_CARD_SOURCE },
    links: [
      {
        label: "Open DTR / PA assistant (SMART)",
        url: "https://arkahealth.com/ins/dtr",
        type: "smart",
        appContext: JSON.stringify({ cpt, payerId, flow: "dtr_optional" }),
      },
    ],
  };
}

/**
 * CDS card for `appointment-book` when the scheduled site is cheapest or within 10% of the best modeled alternative.
 *
 * @param params - Site label and optional savings context for loss-framed copy.
 * @returns Single informational card (never a warning).
 */
export function buildAppointmentSiteOptimalCard(params: {
  siteLabel: string;
  currentPatientUsd: number;
  bestAlternativeUsd: number;
}): CDSCard {
  const { siteLabel, currentPatientUsd, bestAlternativeUsd } = params;
  const gap = Math.max(0, currentPatientUsd - bestAlternativeUsd);
  const gapText =
    gap > 0 ?
      ` If you switched to the lowest modeled alternative today, you might avoid leaving roughly **${formatUsd(gap)}** on the table — yet your current site is still within the acceptable band.`
    : "";
  return {
    uuid: "arka-ins-appointment-optimal",
    summary: "✓ Optimal site selected",
    detail: appendFdaDetailDisclaimer(
      `**${siteLabel}** aligns with the lowest modeled patient responsibility among listed in-network comparators, or is within **10%** of that best option.${gapText}`,
    ),
    indicator: "info",
    source: { ...ARKA_INS_CARD_SOURCE },
  };
}

/**
 * CDS card for `appointment-book` when a cheaper appropriate alternative exists (informational nudge only).
 *
 * @param params - Labels, amounts, SMART reroute URL payload, and loss-framed delta.
 * @returns Informational card with SMART reroute link (never `warning` or `critical`).
 */
export function buildAppointmentCheaperAlternativeCard(params: {
  currentSiteLabel: string;
  cheaperSiteName: string;
  currentPatientUsd: number;
  cheaperPatientUsd: number;
  cpt: string;
  appointmentId?: string;
  suggestedSiteId: string;
}): CDSCard {
  const {
    currentSiteLabel,
    cheaperSiteName,
    currentPatientUsd,
    cheaperPatientUsd,
    cpt,
    appointmentId,
    suggestedSiteId,
  } = params;
  const delta = Math.max(0, currentPatientUsd - cheaperPatientUsd);
  return {
    uuid: "arka-ins-appointment-reroute",
    summary: "Cheaper appropriate alternative available",
    detail: appendFdaDetailDisclaimer(
      `<details><summary>Loss framing — patient cost if you keep the current booking</summary>

Staying with **${currentSiteLabel}** leaves an estimated **${formatUsd(delta)} more** in patient responsibility than **${cheaperSiteName}** for the same modeled benefits (${formatUsd(currentPatientUsd)} vs ${formatUsd(cheaperPatientUsd)}). This is a **nudge**, not a block — you may keep the appointment if logistics or clinical context warrant it.

</details>`,
    ),
    indicator: "info",
    source: { ...ARKA_INS_CARD_SOURCE },
    links: [
      {
        label: "Review reroute in SMART site optimizer",
        url: "https://arkahealth.com/ins/site-optimizer",
        type: "smart",
        appContext: JSON.stringify({
          cpt,
          appointmentId,
          suggestedSiteId,
          flow: "reroute",
        }),
      },
    ],
  };
}
