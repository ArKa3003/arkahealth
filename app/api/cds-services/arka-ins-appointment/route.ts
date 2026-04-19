import { NextResponse } from "next/server";

import { estimatePatientResponsibility } from "@/lib/aiie/oop-estimator";
import {
  appendFdaDetailDisclaimer,
  ARKA_INS_CARD_SOURCE,
} from "@/lib/cards/card-shared";
import {
  buildAppointmentCheaperAlternativeCard,
  buildAppointmentSiteOptimalCard,
  buildCoverageUnavailableCard,
} from "@/lib/davinci/crd";
import { parseCoverage } from "@/lib/fhir/coverage";
import { FHIRClient } from "@/lib/fhir/client";
import {
  appointmentIdFromContext,
  patientIdFromContext,
  resolvePrefetch,
} from "@/lib/fhir/prefetch";
import { createAdminClient } from "@/lib/supabase/admin";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";
import type {
  AIIECoverage,
  AIIECoverageFinancials,
  AIIEOrder,
} from "@/lib/types/aiie";
import type {
  CDSHookRequest,
  CDSHookResponse,
  CDSCard,
} from "@/lib/types/cds-hooks";
import type {
  Appointment,
  Bundle,
  Coverage,
  ServiceRequest,
} from "@/lib/types/fhir";

export const maxDuration = 10;

const CDS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store",
  "X-ARKA-FDA-Compliance": "non-device-cds",
  "X-ARKA-CMS-0057-F-Ready": "true",
  "X-ARKA-Platform-Version": "unified-2.0",
};

type InsValidationEventType = "oop_savings_realized" | "gold_card_check";

function jsonResponse(body: CDSHookResponse, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: CDS_HEADERS });
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function firstCoverageFromBundle(
  bundle: Bundle<Coverage> | undefined,
): Coverage | undefined {
  const entries = bundle?.entry;
  if (!entries?.length) {
    return undefined;
  }
  for (const e of entries) {
    const r = e.resource;
    if (r && (r as Coverage).resourceType === "Coverage") {
      return r as Coverage;
    }
  }
  return undefined;
}

function defaultNegotiatedRateUsd(order: AIIEOrder): number {
  const m = order.modality.toLowerCase();
  if (m.includes("pet") || m.includes("nuclear")) {
    return 3200;
  }
  if (m.includes("mri")) {
    return 2200;
  }
  if (m.includes("ct")) {
    return 1800;
  }
  return 900;
}

function patientLogicalIdFromAppointment(a: Appointment): string | undefined {
  for (const p of a.participant ?? []) {
    const ref = p.actor?.reference?.trim();
    if (ref?.startsWith("Patient/")) {
      return ref.slice(8);
    }
  }
  return undefined;
}

function cptFromServiceRequest(sr: ServiceRequest): string | undefined {
  for (const coding of sr.code?.coding ?? []) {
    const sys = coding.system?.toLowerCase() ?? "";
    if (
      coding.code &&
      /^\d{5}$/.test(coding.code) &&
      (sys.includes("cpt") || sys.includes("ama-assn"))
    ) {
      return coding.code;
    }
  }
  for (const coding of sr.code?.coding ?? []) {
    if (coding.code && /^\d{5}$/.test(coding.code)) {
      return coding.code;
    }
  }
  return undefined;
}

function toAIIECoverageBlock(
  parsed: ReturnType<typeof parseCoverage>,
  coverage: Coverage | undefined,
  order: AIIEOrder,
): AIIECoverage & AIIECoverageFinancials {
  const coinsuranceFrac =
    parsed.coinsurancePct != null
      ? Math.min(1, Math.max(0, parsed.coinsurancePct / 100))
      : 0.2;
  const dedRem = parsed.deductibleRemaining ?? parsed.deductible ?? 0;
  const copay = parsed.copayImaging ?? 0;
  const allowed = defaultNegotiatedRateUsd(order);
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

function patientResponsibilityForAllowed(
  allowed: number,
  financials: AIIECoverageFinancials,
): number {
  const dedRem = Math.max(0, financials.deductibleRemaining);
  const deductibleApplied = Math.min(dedRem, allowed);
  const afterDeductible = Math.max(0, allowed - deductibleApplied);
  const coinsurancePortion =
    afterDeductible * Math.min(1, Math.max(0, financials.coinsurance));
  const raw = financials.copay + deductibleApplied + coinsurancePortion;
  return Math.min(allowed, Math.max(0, raw));
}

interface ShoppableSiteRow {
  id: string;
  name: string;
  cash_price: number | null;
  in_network_payers: string[];
}

async function loadShoppableSitesForCpt(
  cptCode: string,
  payerId: string,
): Promise<ShoppableSiteRow[]> {
  const { data: supabase, error } = createAdminClient();
  if (error || !supabase) {
    return [];
  }
  const { data: rows, error: qErr } = await supabase
    .from("ins_shoppable_sites")
    .select("id, name, cash_price, in_network_payers")
    .eq("cpt_code", cptCode);
  if (qErr || !rows?.length) {
    return [];
  }
  const payer = payerId.toLowerCase();
  const out: ShoppableSiteRow[] = [];
  for (const r of rows as ShoppableSiteRow[]) {
    if (r.cash_price == null || r.cash_price <= 0) {
      continue;
    }
    const inNet = (r.in_network_payers ?? []).some(
      (p) => p.toLowerCase() === payer,
    );
    if (!inNet) {
      continue;
    }
    out.push(r);
  }
  return out;
}

async function logValidationEvent(
  eventType: InsValidationEventType,
  fields: { providerId?: string; payerId?: string; amountUsd?: number },
): Promise<void> {
  const { data: supabase, error } = createAdminClient();
  if (error || !supabase) {
    return;
  }
  await supabase.from("ins_validation_events").insert({
    event_type: eventType,
    provider_id: fields.providerId ?? null,
    payer_id: fields.payerId ?? null,
    amount_usd: fields.amountUsd ?? null,
    minutes_saved: null,
  });
}

function normalizeLabel(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchScore(siteName: string, candidateLabel: string): number {
  const a = normalizeLabel(siteName);
  const b = normalizeLabel(candidateLabel);
  if (!a.length || !b.length) {
    return 0;
  }
  if (a === b) {
    return 100;
  }
  if (a.includes(b) || b.includes(a)) {
    return 80;
  }
  const tokensA = new Set(a.split(" ").filter((t) => t.length > 2));
  let hits = 0;
  for (const t of b.split(" ").filter((x) => x.length > 2)) {
    if (tokensA.has(t)) {
      hits += 1;
    }
  }
  return hits >= 2 ? 60 : hits * 20;
}

async function resolveScheduledSiteLabels(
  appointment: Appointment,
  client: FHIRClient,
): Promise<string[]> {
  const labels: string[] = [];
  for (const p of appointment.participant ?? []) {
    const disp = p.actor?.display?.trim();
    if (disp) {
      labels.push(disp);
    }
    const ref = p.actor?.reference?.trim();
    if (!ref) {
      continue;
    }
    if (ref.startsWith("Location/")) {
      const id = ref.slice("Location/".length);
      const loc = await client.getLocation(id);
      if (loc.data?.name?.trim()) {
        labels.push(loc.data.name.trim());
      }
      continue;
    }
    if (ref.startsWith("Organization/")) {
      const id = ref.slice("Organization/".length);
      const org = await client.readOrganization(id);
      if (org.data?.name?.trim()) {
        labels.push(org.data.name.trim());
      }
    }
  }
  return [...new Set(labels.map((x) => x.trim()).filter(Boolean))];
}

function pickBestShoppableMatch(
  labels: string[],
  rows: ShoppableSiteRow[],
): ShoppableSiteRow | undefined {
  if (!rows.length || !labels.length) {
    return undefined;
  }
  let best: ShoppableSiteRow | undefined;
  let bestScore = 0;
  for (const row of rows) {
    let rowMax = 0;
    for (const lab of labels) {
      rowMax = Math.max(rowMax, matchScore(row.name, lab));
    }
    if (rowMax > bestScore) {
      bestScore = rowMax;
      best = row;
    }
  }
  return bestScore >= 40 ? best : undefined;
}

function buildAppointmentFallbackInfoCard(
  summary: string,
  detail: string,
): CDSCard {
  return {
    uuid: "arka-ins-appointment-fallback",
    summary,
    detail: appendFdaDetailDisclaimer(detail),
    indicator: "info",
    source: { ...ARKA_INS_CARD_SOURCE },
  };
}

/**
 * CDS Hooks `appointment-book` service: single informational site cost nudge against shoppable comparators.
 */
async function handleAppointmentPost(req: Request): Promise<NextResponse> {
  try {
    let hookBody: CDSHookRequest | null = null;
    try {
      hookBody = (await req.json()) as CDSHookRequest;
    } catch {
      const cards = [buildCoverageUnavailableCard()];
      await logValidationEvent("gold_card_check", {});
      return jsonResponse({ cards });
    }

    if (!hookBody || typeof hookBody !== "object") {
      const cards = [buildCoverageUnavailableCard()];
      await logValidationEvent("gold_card_check", {});
      return jsonResponse({ cards });
    }

    const context = asRecord(hookBody.context);
    const appointmentId = appointmentIdFromContext(context);
    let patientId = patientIdFromContext(context);

    if (!appointmentId) {
      const cards = [
        buildAppointmentFallbackInfoCard(
          "Site comparison unavailable",
          "No appointment identifier was supplied in CDS context — site comparison was skipped.",
        ),
      ];
      await logValidationEvent("gold_card_check", {});
      return jsonResponse({ cards });
    }

    const mergedContext: Record<string, unknown> = {
      ...context,
      ...(patientId
        ? {
            patientId: patientId.startsWith("Patient/")
              ? patientId
              : `Patient/${patientId}`,
          }
        : {}),
      appointmentId: `Appointment/${appointmentId}`,
    };

    const requestForPrefetch: CDSHookRequest = {
      ...hookBody,
      context: mergedContext,
    };

    const prefetch = await resolvePrefetch(requestForPrefetch);
    const patient = prefetch.patient;
    patientId = patientId ?? (patient?.id ? patient.id : undefined);

    const appointment = prefetch.appointment;
    if (!appointment) {
      const cards = [
        buildAppointmentFallbackInfoCard(
          "Site comparison unavailable",
          "Appointment data was not available from prefetch or FHIR — site comparison was skipped.",
        ),
      ];
      await logValidationEvent("gold_card_check", {});
      return jsonResponse({ cards });
    }

    patientId =
      patientId ?? patient?.id ?? patientLogicalIdFromAppointment(appointment);
    if (!patientId) {
      const cards = [
        buildAppointmentFallbackInfoCard(
          "Site comparison unavailable",
          "Patient context could not be resolved for this appointment.",
        ),
      ];
      await logValidationEvent("gold_card_check", {});
      return jsonResponse({ cards });
    }

    const coverageResource = firstCoverageFromBundle(prefetch.coverage);
    if (!coverageResource) {
      const cards = [buildCoverageUnavailableCard()];
      await logValidationEvent("gold_card_check", {});
      return jsonResponse({ cards });
    }

    const parsedCoverage = parseCoverage(coverageResource);
    const payerId = parsedCoverage.payerId ?? "unknown-payer";

    const client = new FHIRClient(
      hookBody.fhirServer,
      hookBody.fhirAuthorization,
    );

    let cpt: string | undefined;
    for (const ref of appointment.reasonReference ?? []) {
      const r = ref.reference?.trim();
      if (!r?.startsWith("ServiceRequest/")) {
        continue;
      }
      const id = r.slice("ServiceRequest/".length);
      const sr = await client.readServiceRequest(id);
      if (sr.data) {
        cpt = cptFromServiceRequest(sr.data) ?? cpt;
        if (cpt) {
          break;
        }
      }
    }

    if (!cpt) {
      const cards = [
        buildAppointmentFallbackInfoCard(
          "✓ Optimal site selected",
          "No linked imaging procedure code was found on the appointment — comparator pricing was not evaluated.",
        ),
      ];
      await logValidationEvent("gold_card_check", { payerId });
      return jsonResponse({ cards });
    }

    const order: AIIEOrder = {
      cpt,
      modality: "Imaging",
      bodyPart: undefined,
      procedure: `Imaging service (${cpt})`,
    };

    const oopCoverage = toAIIECoverageBlock(
      parsedCoverage,
      coverageResource,
      order,
    );
    const sites = await loadShoppableSitesForCpt(cpt, payerId);

    const siteLabels = await resolveScheduledSiteLabels(appointment, client);
    const primaryLabel = siteLabels[0] ?? "Scheduled imaging site";
    const matched = pickBestShoppableMatch(siteLabels, sites);

    const financials: AIIECoverageFinancials = { ...oopCoverage };

    let currentPatient = 0;
    if (matched?.cash_price != null) {
      currentPatient = patientResponsibilityForAllowed(
        matched.cash_price,
        financials,
      );
    } else {
      const oop = await estimatePatientResponsibility({
        cptCode: cpt,
        coverage: oopCoverage,
      });
      currentPatient = oop.data?.estimatedPatientResponsibility ?? 0;
    }

    if (sites.length === 0) {
      const cards = [
        buildAppointmentSiteOptimalCard({
          siteLabel: primaryLabel,
          currentPatientUsd: currentPatient,
          bestAlternativeUsd: currentPatient,
        }),
      ];
      await logValidationEvent("gold_card_check", { payerId });
      return jsonResponse({ cards });
    }

    let bestRow = sites[0]!;
    let bestPatient = patientResponsibilityForAllowed(
      bestRow.cash_price!,
      financials,
    );
    for (const row of sites) {
      if (row.cash_price == null) {
        continue;
      }
      const p = patientResponsibilityForAllowed(row.cash_price, financials);
      if (p < bestPatient) {
        bestPatient = p;
        bestRow = row;
      }
    }

    const threshold = bestPatient * 1.1;
    const currentIsOptimal = currentPatient <= threshold;

    let card: CDSCard;
    if (currentIsOptimal) {
      card = buildAppointmentSiteOptimalCard({
        siteLabel: primaryLabel,
        currentPatientUsd: currentPatient,
        bestAlternativeUsd: bestPatient,
      });
    } else {
      const delta = Math.max(0, currentPatient - bestPatient);
      card = buildAppointmentCheaperAlternativeCard({
        currentSiteLabel: primaryLabel,
        cheaperSiteName: bestRow.name,
        currentPatientUsd: currentPatient,
        cheaperPatientUsd: bestPatient,
        cpt,
        appointmentId,
        suggestedSiteId: bestRow.id,
      });
      if (delta > 0) {
        await logValidationEvent("oop_savings_realized", {
          payerId,
          amountUsd: delta,
        });
      }
    }

    return jsonResponse({ cards: [card] });
  } catch {
    const cards = [buildCoverageUnavailableCard()];
    await logValidationEvent("gold_card_check", {});
    return jsonResponse({ cards });
  }
}

export const POST = withInsApiLogging(handleAppointmentPost);

/**
 * CORS preflight for CDS Hooks clients.
 */
function handleAppointmentOptions(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CDS_HEADERS });
}

export const OPTIONS = withInsApiLogging(async (_request: Request) => handleAppointmentOptions());
