import { NextResponse } from "next/server";

import { classifyAction, invertToDenialRisk } from "@/lib/aiie/denial-risk";
import { computeGoldCardScore } from "@/lib/aiie/gold-card";
import { estimatePatientResponsibility } from "@/lib/aiie/oop-estimator";
import { clinicalDocumentationHintsFromServiceRequest } from "@/lib/aiie/service-request-hints";
import { scoreOrder } from "@/lib/aiie/scoring-engine";
import type { ShoppableSite } from "@/lib/cards/alternative-site-card";
import type { InsPaHistorySimilarMetrics } from "@/lib/cards/coverage-card";
import { buildCoverageUnavailableCard, buildCRDCards } from "@/lib/davinci/crd";
import { parseCoverage } from "@/lib/fhir/coverage";
import { FHIRClient } from "@/lib/fhir/client";
import {
  patientIdFromContext,
  resolvePrefetch,
  userIdFromContext,
} from "@/lib/fhir/prefetch";
import { createAdminClient } from "@/lib/supabase/admin";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";
import type {
  AIIECoverage,
  AIIECoverageFinancials,
  AIIEInput,
  AIIEOrder,
  AIIERedFlags,
  GoldCardStatus,
} from "@/lib/types/aiie";
import type { CDSHookRequest, CDSHookResponse } from "@/lib/types/cds-hooks";
import type {
  Bundle,
  Coverage,
  FHIRReference,
  Patient,
  Practitioner,
  ServiceRequest,
} from "@/lib/types/fhir";

export const maxDuration = 10;

const CDS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store",
  "X-ARKA-FDA-Compliance": "non-device-cds",
};

const AIIE_SCORE_TIMEOUT_MS = 650;

type InsValidationEventType =
  | "pa_submitted"
  | "pa_avoided_by_gold_card"
  | "pa_avoided_by_crd"
  | "gold_card_check";

function jsonResponse(body: CDSHookResponse, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: CDS_HEADERS });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error("aiie_timeout"));
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(t);
        reject(e instanceof Error ? e : new Error("aiie_failed"));
      },
    );
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

/**
 * Reads `context.selections` into canonical FHIR reference strings.
 */
function referencesFromSelections(context: Record<string, unknown>): string[] {
  const raw = context.selections;
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.trim()) {
      out.push(item.trim());
      continue;
    }
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      const ref = o.reference;
      if (typeof ref === "string" && ref.trim()) {
        out.push(ref.trim());
        continue;
      }
      const res = o.resource;
      if (res && typeof res === "object") {
        const r = res as { resourceType?: string; id?: string };
        if (r.resourceType && r.id) {
          out.push(`${r.resourceType}/${r.id}`);
        }
      }
    }
  }
  return out;
}

function tailFromReference(ref: string): string | undefined {
  const idx = ref.lastIndexOf("/");
  if (idx < 0 || idx >= ref.length - 1) {
    return undefined;
  }
  return ref.slice(idx + 1);
}

function patientLogicalIdFromReference(ref?: FHIRReference): string | undefined {
  const r = ref?.reference?.trim();
  if (!r?.startsWith("Patient/")) {
    return undefined;
  }
  return r.startsWith("Patient/") ? r.slice(8) : undefined;
}

function emptyRedFlags(): AIIERedFlags {
  return {
    cancerHistory: false,
    neurologicalDeficit: false,
    fever: false,
    weightLoss: false,
    trauma: false,
    immunocompromised: false,
    ivDrugUse: false,
    osteoporosis: false,
    ageOver50: false,
    ageUnder18: false,
    progressiveSymptoms: false,
    bladderBowelDysfunction: false,
    suddenOnset: false,
  };
}

function isImagingServiceRequest(sr: ServiceRequest): boolean {
  for (const c of sr.category ?? []) {
    const blob = [
      c.text?.toLowerCase() ?? "",
      ...(c.coding ?? []).map((x) => `${x.code?.toLowerCase() ?? ""} ${x.display?.toLowerCase() ?? ""}`),
    ].join(" ");
    if (blob.includes("imag")) {
      return true;
    }
    if ((c.coding ?? []).some((co) => co.code?.toLowerCase() === "imaging")) {
      return true;
    }
  }
  const proc = `${sr.code?.text ?? ""} ${(sr.code?.coding ?? []).map((x) => x.display ?? "").join(" ")}`.toLowerCase();
  return /(mri|ct|xr|x-ray|xray|ultrasound|\bus\b|pet|nuclear|fluoro|dexa|mamm)/i.test(proc);
}

function cptFromServiceRequest(sr: ServiceRequest): string | undefined {
  for (const coding of sr.code?.coding ?? []) {
    const sys = coding.system?.toLowerCase() ?? "";
    if (coding.code && /^\d{5}$/.test(coding.code) && (sys.includes("cpt") || sys.includes("ama-assn"))) {
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

function modalityFromServiceRequest(sr: ServiceRequest): string {
  const text = [sr.code?.text, ...(sr.code?.coding ?? []).map((c) => c.display ?? "")].filter(Boolean).join(" ");
  const t = text.toLowerCase();
  if (t.includes("mri")) {
    return t.includes("contrast") ? "MRI with contrast" : "MRI";
  }
  if (/\bct\b/.test(t) || t.includes("computed tomography")) {
    return t.includes("contrast") ? "CT with contrast" : "CT";
  }
  if (t.includes("ultrasound") || /\bus\b/.test(t)) {
    return "Ultrasound";
  }
  if (t.includes("pet")) {
    return "PET-CT";
  }
  if (t.includes("nuclear")) {
    return "Nuclear Medicine";
  }
  if (t.includes("x-ray") || t.includes("xr ") || t.startsWith("xr")) {
    return "X-ray";
  }
  return text.trim().length > 0 ? text.trim() : "Imaging";
}

function orderFromServiceRequest(sr: ServiceRequest): AIIEOrder {
  const cpt = cptFromServiceRequest(sr);
  const modality = modalityFromServiceRequest(sr);
  const bodyPart = sr.bodySite?.[0]?.text ?? sr.bodySite?.[0]?.coding?.[0]?.display;
  const procedure =
    sr.code?.text ??
    sr.code?.coding?.find((c) => c.display)?.display ??
    sr.code?.coding?.[0]?.code ??
    "Imaging service";
  return {
    cpt,
    modality,
    bodyPart,
    procedure,
  };
}

function patientAgeYears(p: Patient | undefined): number {
  if (!p?.birthDate) {
    return 45;
  }
  const d = new Date(p.birthDate);
  if (Number.isNaN(d.getTime())) {
    return 45;
  }
  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.min(120, Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))));
}

function patientSex(p: Patient | undefined): "male" | "female" {
  const g = p?.gender?.toLowerCase();
  if (g === "female") {
    return "female";
  }
  return "male";
}

function chiefComplaintFromServiceRequest(sr: ServiceRequest): string {
  const parts: string[] = [];
  for (const rc of sr.reasonCode ?? []) {
    if (rc.text) {
      parts.push(rc.text);
    }
    for (const c of rc.coding ?? []) {
      if (c.display) {
        parts.push(c.display);
      }
    }
  }
  const joined = parts.join("; ").trim();
  return joined.length > 0 ? joined : "Imaging order evaluation";
}

function symptomsFromServiceRequest(sr: ServiceRequest): string[] {
  const s = new Set<string>();
  for (const rc of sr.reasonCode ?? []) {
    for (const c of rc.coding ?? []) {
      if (c.display) {
        s.add(c.display);
      }
    }
    if (rc.text) {
      s.add(rc.text);
    }
  }
  return [...s].slice(0, 12);
}

function firstCoverageFromBundle(bundle: Bundle<Coverage> | undefined): Coverage | undefined {
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

function serviceRequestFromBundle(
  bundle: Bundle<ServiceRequest> | undefined,
  logicalId: string,
): ServiceRequest | undefined {
  for (const e of bundle?.entry ?? []) {
    const r = e.resource;
    if (r?.resourceType === "ServiceRequest" && r.id === logicalId) {
      return r;
    }
  }
  return undefined;
}

function firstImagingServiceRequestFromBundle(
  bundle: Bundle<ServiceRequest> | undefined,
): ServiceRequest | undefined {
  for (const e of bundle?.entry ?? []) {
    const r = e.resource;
    if (r?.resourceType === "ServiceRequest" && isImagingServiceRequest(r)) {
      return r;
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

function toAIIECoverageBlock(
  parsed: ReturnType<typeof parseCoverage>,
  coverage: Coverage | undefined,
  order: AIIEOrder,
): AIIECoverage & AIIECoverageFinancials {
  const coinsuranceFrac =
    parsed.coinsurancePct != null ? Math.min(1, Math.max(0, parsed.coinsurancePct / 100)) : 0.2;
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

function buildAIIEInput(params: {
  patient: Patient | undefined;
  serviceRequest: ServiceRequest;
  parsedCoverage: ReturnType<typeof parseCoverage>;
  coverage: Coverage | undefined;
}): AIIEInput {
  const { patient, serviceRequest, parsedCoverage, coverage } = params;
  const age = patientAgeYears(patient);
  const sex = patientSex(patient);
  const order = orderFromServiceRequest(serviceRequest);
  const chief = chiefComplaintFromServiceRequest(serviceRequest);
  const symptoms = symptomsFromServiceRequest(serviceRequest);
  const red = emptyRedFlags();
  if (age >= 50) {
    red.ageOver50 = true;
  }
  if (age < 18) {
    red.ageUnder18 = true;
  }

  const hints = clinicalDocumentationHintsFromServiceRequest(serviceRequest);
  const priorImaging = hints.priorImaging ?? false;
  const priorImagingTimeframe = hints.priorImagingTimeframe;
  const conservativeManagementTried = hints.conservativeManagementTried ?? false;
  const conservativeManagementDuration = hints.conservativeManagementDuration;

  return {
    patient: { age, sex, pregnant: false },
    clinicalFactors: {
      chiefComplaint: chief,
      duration: "Unknown",
      symptoms,
      redFlags: red,
      priorImaging,
      priorImagingTimeframe,
      conservativeManagementTried,
      conservativeManagementDuration,
    },
    order,
    coverage: {
      coverageId: coverage?.id,
      payerId: parsedCoverage.payerId,
      payerName: parsedCoverage.payerName,
      planName: parsedCoverage.planName ?? parsedCoverage.planId,
    },
    age,
    sex,
    chiefComplaint: chief,
    duration: "Unknown",
    symptoms,
    redFlags: red,
    priorImaging,
    priorImagingTimeframe,
    conservativeManagementTried,
    conservativeManagementDuration,
    requestedModality: order.modality,
    requestedProcedure: order.procedure,
  };
}

function extractNpi(practitioner: Practitioner | undefined): string | undefined {
  if (!practitioner?.identifier?.length) {
    return undefined;
  }
  for (const id of practitioner.identifier) {
    const sys = id.system?.toLowerCase() ?? "";
    const v = id.value?.replace(/\D/g, "") ?? "";
    if (v.length !== 10) {
      continue;
    }
    if (sys.includes("npi") || sys.includes("2.16.840.1.113883.4.6")) {
      return v;
    }
    const typeCode = id.type?.coding?.[0]?.code?.toUpperCase();
    if (typeCode === "NPI") {
      return v;
    }
  }
  return undefined;
}

async function resolveInsProviderUuid(
  practitioner: Practitioner | undefined,
): Promise<string | undefined> {
  const npi = extractNpi(practitioner);
  if (!npi) {
    return undefined;
  }
  const { data: supabase, error } = createAdminClient();
  if (error || !supabase) {
    return undefined;
  }
  const { data } = await supabase.from("ins_providers").select("id").eq("npi", npi).maybeSingle();
  const row = data as { id?: string } | null;
  return typeof row?.id === "string" ? row.id : undefined;
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

function practitionerDisplayName(practitioner: Practitioner | undefined): string {
  const n0 = practitioner?.name?.[0];
  if (!n0) {
    return "Ordering clinician";
  }
  if (n0.text?.trim()) {
    return n0.text.trim();
  }
  const given = n0.given?.filter(Boolean).join(" ");
  const family = n0.family;
  const composed = [given, family].filter(Boolean).join(" ");
  return composed.trim() || "Ordering clinician";
}

async function loadShoppableSitesForCpt(cptCode: string, payerId: string): Promise<ShoppableSite[]> {
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
  const out: ShoppableSite[] = [];
  for (const r of rows as {
    id: string;
    name: string;
    cash_price: number | null;
    in_network_payers: string[];
  }[]) {
    if (r.cash_price == null || r.cash_price <= 0) {
      continue;
    }
    const inNet = (r.in_network_payers ?? []).some((p) => p.toLowerCase() === payer);
    if (!inNet) {
      continue;
    }
    out.push({
      id: r.id,
      name: r.name,
      cashPrice: r.cash_price,
    });
  }
  return out;
}

async function loadPaHistorySimilarMetrics(
  providerId: string | undefined,
  payerId: string,
  cptCode: string,
): Promise<InsPaHistorySimilarMetrics | undefined> {
  const { data: supabase, error } = createAdminClient();
  if (error || !supabase || !providerId) {
    return undefined;
  }
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  const windowIso = twoYearsAgo.toISOString();

  const { data: me } = await supabase
    .from("ins_providers")
    .select("specialty")
    .eq("id", providerId)
    .maybeSingle<{ specialty: string | null }>();

  let providerIds: string[] = [providerId];
  if (me?.specialty?.trim()) {
    const { data: peers } = await supabase
      .from("ins_providers")
      .select("id")
      .eq("specialty", me.specialty)
      .limit(500);
    if (peers?.length) {
      providerIds = [...new Set((peers as { id: string }[]).map((p) => p.id))];
    }
  }

  const { data: decisions, error: hErr } = await supabase
    .from("ins_pa_history")
    .select("decision")
    .eq("payer_id", payerId)
    .eq("cpt_code", cptCode)
    .in("provider_id", providerIds)
    .gte("submitted_at", windowIso);

  if (hErr || !decisions?.length) {
    return undefined;
  }
  const list = decisions as { decision: string }[];
  const approved = list.filter(
    (r) => r.decision === "approved" || r.decision === "auto_approved",
  ).length;
  return {
    approvedPercent: Math.round((approved / list.length) * 100),
    sampleSize: list.length,
  };
}

function outcomeEventType(
  aiieSucceeded: boolean,
  goldEligible: boolean,
  denialRisk: number,
): InsValidationEventType {
  if (!aiieSucceeded) {
    return "gold_card_check";
  }
  if (goldEligible) {
    return "pa_avoided_by_gold_card";
  }
  if (denialRisk <= 3) {
    return "pa_avoided_by_crd";
  }
  if (denialRisk <= 6) {
    return "gold_card_check";
  }
  return "pa_submitted";
}

/**
 * CDS Hooks `order-select` service: coverage, gold card, OOP, and AIIE intelligence for imaging orders.
 */
async function handleCoveragePost(req: Request): Promise<NextResponse> {
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
  const selectionRefs = referencesFromSelections(context);

  let patientId = patientIdFromContext(context);
  let userId = userIdFromContext(context);

  let selectedSrId: string | undefined;
  for (const ref of selectionRefs) {
    if (ref.startsWith("ServiceRequest/")) {
      selectedSrId = tailFromReference(ref);
      break;
    }
  }

  const prefetchRecord = asRecord(hookBody.prefetch);
  for (const item of Array.isArray(context.selections) ? context.selections : []) {
    if (item && typeof item === "object") {
      const res = (item as { resource?: ServiceRequest }).resource;
      if (res?.resourceType === "ServiceRequest") {
        patientId = patientId ?? patientLogicalIdFromReference(res.subject);
        if (!selectedSrId && res.id) {
          selectedSrId = res.id;
        }
      }
    }
  }

  if (prefetchRecord.serviceRequest && typeof prefetchRecord.serviceRequest === "object") {
    const bundle = prefetchRecord.serviceRequest as Bundle<ServiceRequest>;
    if (bundle.resourceType === "Bundle" && selectedSrId) {
      const match = serviceRequestFromBundle(bundle, selectedSrId);
      patientId = patientId ?? patientLogicalIdFromReference(match?.subject);
    }
  }

  if (!patientId && selectedSrId) {
    const earlyClient = new FHIRClient(hookBody.fhirServer, hookBody.fhirAuthorization);
    const srEarly = await earlyClient.readServiceRequest(selectedSrId);
    patientId = patientId ?? patientLogicalIdFromReference(srEarly.data?.subject);
  }

  const mergedContext: Record<string, unknown> = {
    ...context,
    ...(patientId ? { patientId: patientId.startsWith("Patient/") ? patientId : `Patient/${patientId}` } : {}),
    ...(userId ?
      { userId: userId.startsWith("Practitioner/") ? userId : `Practitioner/${userId}` }
    : {}),
  };

  const requestForPrefetch: CDSHookRequest = {
    ...hookBody,
    context: mergedContext,
  };

  const prefetch = await resolvePrefetch(requestForPrefetch);

  const patient = prefetch.patient;
  const practitioner = prefetch.practitioner;

  userId = userId ?? extractPractitionerIdFromResource(practitioner);
  patientId = patientId ?? (patient?.id ? patient.id : undefined);
  if (userId && !mergedContext.userId) {
    mergedContext.userId = userId.startsWith("Practitioner/") ? userId : `Practitioner/${userId}`;
  }

  const client = new FHIRClient(hookBody.fhirServer, hookBody.fhirAuthorization);

  let serviceRequest: ServiceRequest | undefined;
  if (selectedSrId) {
    serviceRequest =
      serviceRequestFromBundle(prefetch.serviceRequest, selectedSrId) ??
      (await client.readServiceRequest(selectedSrId)).data ??
      undefined;
  }
  if (!serviceRequest) {
    serviceRequest = firstImagingServiceRequestFromBundle(prefetch.serviceRequest);
  }

  if (!serviceRequest || !isImagingServiceRequest(serviceRequest)) {
    const cards = [buildCoverageUnavailableCard()];
    await logValidationEvent("gold_card_check", {});
    return jsonResponse({ cards });
  }

  patientId = patientId ?? patientLogicalIdFromReference(serviceRequest.subject);

  const coverageResource = firstCoverageFromBundle(prefetch.coverage);
  if (!coverageResource) {
    const cards = [buildCoverageUnavailableCard()];
    await logValidationEvent("gold_card_check", {
      payerId: undefined,
      providerId: await resolveInsProviderUuid(practitioner),
    });
    return jsonResponse({ cards });
  }

  const parsedCoverage = parseCoverage(coverageResource);
  const payerId = parsedCoverage.payerId ?? "unknown-payer";
  const cpt = cptFromServiceRequest(serviceRequest) ?? "00000";

  const aiieInput = buildAIIEInput({
    patient,
    serviceRequest,
    parsedCoverage,
    coverage: coverageResource,
  });

  const insProviderUuid = await resolveInsProviderUuid(practitioner);
  const oopCoverage = toAIIECoverageBlock(parsedCoverage, coverageResource, aiieInput.order);

  const scorePromise = withTimeout(scoreOrder(aiieInput), AIIE_SCORE_TIMEOUT_MS);
  const goldPromise =
    insProviderUuid ?
      computeGoldCardScore(insProviderUuid, cpt, payerId)
    : Promise.resolve({
        data: null,
        error: { code: "NO_INS_PROVIDER", message: "No matching ins_providers row for practitioner NPI." },
      });
  const oopPromise = estimatePatientResponsibility({ cptCode: cpt, coverage: oopCoverage });

  const settled = await Promise.allSettled([scorePromise, goldPromise, oopPromise]);

  const scoreSettled = settled[0];
  const goldSettled = settled[1];
  const oopSettled = settled[2];

  if (scoreSettled.status === "rejected") {
    const cards = [buildCoverageUnavailableCard()];
    await logValidationEvent("gold_card_check", {
      providerId: insProviderUuid,
      payerId,
    });
    return jsonResponse({ cards });
  }

  const aiieScore = scoreSettled.value;
  const denialRisk = invertToDenialRisk(aiieScore.clinicalScore);

  let goldCard: GoldCardStatus | null = null;
  if (goldSettled.status === "fulfilled" && goldSettled.value.data) {
    goldCard = goldSettled.value.data;
  }

  let oop = oopSettled.status === "fulfilled" ? (oopSettled.value.data ?? null) : null;

  const goldEligible = goldCard?.eligible === true;
  const action = classifyAction(denialRisk, goldEligible);

  const [alternatives, paHistorySimilar] = await Promise.all([
    loadShoppableSitesForCpt(cpt, payerId),
    loadPaHistorySimilarMetrics(insProviderUuid, payerId, cpt),
  ]);

  const cards = buildCRDCards({
    aiie: aiieScore,
    denialRisk,
    action,
    goldCard,
    oopEstimate: oop,
    alternatives,
    coverage: parsedCoverage,
    order: { id: serviceRequest.id ?? "unknown-order", cpt },
    provider: {
      id: insProviderUuid,
      name: practitionerDisplayName(practitioner),
    },
    coverageResource,
    paHistorySimilar,
  });

  let amountUsd: number | undefined;
  if (oop?.alternativeSiteRecommended && oop.cheapestInNetworkSite) {
    const baseline = oop.estimatedPatientResponsibility;
    const alt = oop.cheapestInNetworkSite.estimatedPrice;
    amountUsd = Math.max(0, baseline - alt);
  }

  await logValidationEvent(
    outcomeEventType(true, goldEligible, denialRisk),
    {
      providerId: insProviderUuid,
      payerId,
      amountUsd,
    },
  );

  return jsonResponse({ cards });
}

export const POST = withInsApiLogging(handleCoveragePost);

function extractPractitionerIdFromResource(pr: Practitioner | undefined): string | undefined {
  if (!pr?.id) {
    return undefined;
  }
  return pr.id;
}

/**
 * CORS preflight for CDS Hooks clients.
 */
function handleCoverageOptions(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CDS_HEADERS });
}

export const OPTIONS = withInsApiLogging(async (_request: Request) => handleCoverageOptions());
