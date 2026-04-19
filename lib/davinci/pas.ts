/**
 * Da Vinci PAS (Prior Authorization Support): X12 278–aligned FHIR Claim builder and
 * simulated payer adjudication. Swap {@link submitPAS} for Availity / Change Healthcare later.
 */

import { createHash, randomUUID } from "crypto";

import { scoreOrder } from "@/lib/aiie/scoring-engine";
import { parseCoverage } from "@/lib/fhir/coverage";
import {
  applyQuestionnaireResponseToInput,
  generateQuestionnaire,
} from "@/lib/davinci/dtr";
import type { PASRequest, PASResponse, PASCmsDenialDetail } from "@/lib/types/davinci";
import type { AIIEInput, AIIEOrder, AIIERedFlags, AIIEScore } from "@/lib/types/aiie";
import type {
  Claim,
  Coverage,
  FHIRCodeableConcept,
  FHIRReference,
  Practitioner,
  QuestionnaireResponse,
  ServiceRequest,
} from "@/lib/types/fhir";

/** Da Vinci PAS Claim build profile. */
export const PAS_CLAIM_PROFILE =
  "http://hl7.org/fhir/us/davinci-pas/StructureDefinition/profile-claim";

/** Da Vinci PAS ClaimResponse profile (simulated payer). */
export const PAS_CLAIM_RESPONSE_PROFILE =
  "http://hl7.org/fhir/us/davinci-pas/StructureDefinition/profile-claimresponse";

/** MGMA-style manual PA handling time baseline used for ROI logging (minutes). */
export const PAS_SUBMIT_MGMA_MINUTES_BASELINE = 25;

const ADJUDICATION_SYSTEM = "http://terminology.hl7.org/CodeSystem/adjudication";

/** Maps AIIE factor ids to plausible X12 AAA-style reason codes (simulation). */
const FACTOR_AAA_CODE: Record<string, string> = {
  clinical_indication: "15",
  prior_imaging_redundancy: "33",
  red_flag_symptoms: "44",
  guideline_alignment: "79",
  patient_risk_factors: "58",
  radiation_exposure: "62",
};

export type PASSubmitError = { code: string; message: string };

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

function icd10CodesFromServiceRequest(sr: ServiceRequest): string[] {
  const out: string[] = [];
  for (const rc of sr.reasonCode ?? []) {
    for (const c of rc.coding ?? []) {
      const sys = (c.system ?? "").toLowerCase();
      if (
        c.code &&
        (sys.includes("icd-10") || sys.includes("icd10") || sys.includes("icd10cm") || sys.includes("icd-10-cm"))
      ) {
        out.push(c.code);
      }
    }
  }
  return out.length > 0 ? out : ["Z01.818"];
}

/**
 * Builds a deterministic baseline {@link AIIEInput} from an imaging order and coverage.
 *
 * @param order - FHIR ServiceRequest for the study.
 * @param coverage - FHIR Coverage for payer context.
 */
export function buildBaselineAiieInputFromOrder(
  order: ServiceRequest,
  coverage: Coverage,
): AIIEInput {
  const parsed = parseCoverage(coverage);
  const orderBlock = orderFromServiceRequest(order);
  const chief = chiefComplaintFromServiceRequest(order);
  const symptoms = symptomsFromServiceRequest(order);
  const red = emptyRedFlags();

  return {
    patient: { age: 45, sex: "male", pregnant: false },
    clinicalFactors: {
      chiefComplaint: chief,
      duration: "Unknown",
      symptoms,
      redFlags: red,
      priorImaging: false,
      conservativeManagementTried: false,
    },
    order: orderBlock,
    coverage: {
      coverageId: coverage.id,
      payerId: parsed.payerId,
      payerName: parsed.payerName,
      planName: parsed.planName ?? parsed.planId,
    },
    age: 45,
    sex: "male",
    chiefComplaint: chief,
    duration: "Unknown",
    symptoms,
    redFlags: red,
    priorImaging: false,
    conservativeManagementTried: false,
    requestedModality: orderBlock.modality,
    requestedProcedure: orderBlock.procedure,
  };
}

function practitionerRef(provider: Practitioner): FHIRReference {
  const id = provider.id?.trim();
  if (id) {
    return {
      reference: `Practitioner/${id}`,
      display: provider.name?.[0]?.text ?? provider.name?.[0]?.family,
    };
  }
  const npi = provider.identifier?.find((i) => i.system?.includes("npi"))?.value;
  return {
    reference: npi ? `Practitioner/npi-${npi}` : "Practitioner/unknown",
    display: provider.name?.[0]?.text,
  };
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Builds a Da Vinci PAS Claim with CPT line, ICD-10 diagnoses, and QuestionnaireResponse reference.
 *
 * @param order - Ordering ServiceRequest.
 * @param questionnaireResponse - Completed DTR response.
 * @param coverage - Active coverage.
 * @param provider - Ordering practitioner.
 */
export function buildPASRequest(
  order: ServiceRequest,
  questionnaireResponse: QuestionnaireResponse,
  coverage: Coverage,
  provider: Practitioner,
): PASRequest {
  const baseline = buildBaselineAiieInputFromOrder(order, coverage);
  const cpt =
    cptFromServiceRequest(order) ??
    baseline.order.cpt ??
    "00000";
  const icd10s = icd10CodesFromServiceRequest(order);
  const qrId = questionnaireResponse.id?.trim() ?? `qr-${sha256Hex(JSON.stringify(questionnaireResponse)).slice(0, 12)}`;
  const covId = coverage.id?.trim() ?? "coverage-1";
  const patientRef = order.subject;

  const diagnosis: NonNullable<Claim["diagnosis"]> = icd10s.map((code, i) => ({
    sequence: i + 1,
    diagnosisCodeableConcept: {
      coding: [
        {
          system: "http://hl7.org/fhir/sid/icd-10-cm",
          code,
          display: code,
        },
      ],
      text: code,
    },
  }));

  const payorRef = coverage.payor?.[0];

  const claim: Claim = {
    resourceType: "Claim",
    id: `pas-claim-${qrId}`,
    meta: {
      profile: [PAS_CLAIM_PROFILE],
    },
    status: "active",
    type: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/claim-type",
          code: "professional",
          display: "Professional",
        },
      ],
    },
    use: "preauthorization",
    insurer: payorRef,
    patient: patientRef,
    created: new Date().toISOString(),
    provider: practitionerRef(provider),
    priority: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/processpriority",
          code: "normal",
        },
      ],
    },
    prescription: order.id ? { reference: `ServiceRequest/${order.id}` } : undefined,
    supportingInfo: [
      {
        sequence: 1,
        category: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/claiminformationcategory",
              code: "info",
              display: "Information",
            },
          ],
        },
        valueReference: {
          reference: `QuestionnaireResponse/${qrId}`,
          display: "DTR QuestionnaireResponse",
        },
      },
    ],
    insurance: [
      {
        sequence: 1,
        focal: true,
        coverage: { reference: `Coverage/${covId}` },
      },
    ],
    diagnosis,
    item: [
      {
        sequence: 1,
        productOrService: {
          coding: [
            {
              system: "http://www.ama-assn.org/go/cpt",
              code: cpt,
              display: baseline.order.procedure,
            },
          ],
          text: baseline.order.procedure,
        },
        diagnosisSequence: diagnosis.map((d) => d.sequence),
        informationSequence: [1],
        servicedDate: order.authoredOn?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        quantity: { value: 1 },
      },
    ],
  };

  return {
    claim,
    questionnaireResponse: { ...questionnaireResponse, id: qrId },
    aiieInput: baseline,
    serviceRequest: order,
    coverage,
    orderingProvider: provider,
  };
}

function addDaysIso(days: number, from: Date): string {
  const d = new Date(from.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function sortFactorsForReasons(score: AIIEScore): AIIEScore["factors"] {
  return [...score.factors].sort((a, b) => a.contribution - b.contribution);
}

function buildCmsDetails(
  decision: "pended" | "denied",
  factors: AIIEScore["factors"],
  decisionAt: Date,
  appealEnd: string,
): PASCmsDenialDetail[] {
  const max = decision === "denied" ? 4 : 3;
  const neg = factors.filter((f) => f.contribution < 0);
  const use = (neg.length > 0 ? neg : factors).slice(0, max);

  return use.map((f) => {
    const code = FACTOR_AAA_CODE[f.id] ?? "79";
    const reasonText =
      decision === "denied" ?
        `AIIE factor "${f.name}" indicates this service does not meet simulated payer medical-necessity expectations (modeled contribution ${f.contribution.toFixed(3)}).`
      : `Additional documentation may be needed for "${f.name}" (modeled contribution ${f.contribution.toFixed(3)}) before a final determination.`;
    return {
      reasonCode: code,
      reasonText,
      citation: f.evidenceCitation,
      appealInstructions:
        `You may request a formal appeal within 180 days of this decision. Address the clinical points above and include any missing documentation cited in your DTR responses. Submit through your payer prior-authorization or appeals channel listed on the member benefit card. Reference factor: ${f.id}.`,
      appealDeadline: appealEnd,
      decisionTimestamp: decisionAt.toISOString(),
    };
  });
}

/**
 * Simulated payer PAS adjudication: merges DTR answers, re-runs AIIE, and returns a PAS ClaimResponse.
 * Swap this function for a real clearinghouse client when integrating Availity or Change Healthcare.
 *
 * @param request - Full PAS packet from {@link buildPASRequest}.
 * @param options - Optional correlation id to align with `ins_pa_history.id`; `goldCardEligible`
 *   forces an approved path when the provider is gold-carded for this CPT/payer (simulation).
 * @returns `PASResponse` on success or a structured error; does not throw.
 */
export async function submitPAS(
  request: PASRequest,
  options?: { paId?: string; goldCardEligible?: boolean },
): Promise<{ data: PASResponse | null; error: PASSubmitError | null }> {
  try {
    const parsed = parseCoverage(request.coverage);
    const baselineScore = await scoreOrder(request.aiieInput);
    const questionnaire = generateQuestionnaire(
      baselineScore,
      parsed,
      request.serviceRequest,
    );
    const merged = applyQuestionnaireResponseToInput(
      request.aiieInput,
      questionnaire,
      request.questionnaireResponse,
    );
    const finalScore = await scoreOrder(merged);
    const denialRisk = finalScore.denialRisk;
    const clinicalScore = finalScore.clinicalScore;
    const decisionAt = new Date();
    const appealEnd = addDaysIso(180, decisionAt);
    const sortedFactors = sortFactorsForReasons(finalScore);

    let decision: PASResponse["decision"];
    let disposition: string;
    let outcome: string;
    let cmsDenialDetails: PASCmsDenialDetail[] = [];

    if (options?.goldCardEligible) {
      decision = "approved";
      disposition =
        "Prior authorization auto-approved under simulated gold card program: historical PA performance meets eligibility for this CPT and payer; full manual PA review is bypassed in this pathway.";
      outcome = "complete";
    } else if (denialRisk <= 2) {
      decision = "approved";
      disposition = "Prior authorization approved based on simulated ARKA AIIE review of the submitted packet.";
      outcome = "complete";
    } else if (denialRisk >= 6) {
      decision = "denied";
      disposition = "Prior authorization denied based on simulated ARKA AIIE medical necessity review.";
      outcome = "error";
      cmsDenialDetails = buildCmsDetails("denied", sortedFactors, decisionAt, appealEnd);
    } else {
      decision = "pended";
      disposition =
        "Prior authorization pended pending additional review of documentation highlighted by ARKA AIIE.";
      outcome = "queued";
      cmsDenialDetails = buildCmsDetails("pended", sortedFactors, decisionAt, appealEnd);
    }

    const claimRef =
      request.claim.id ?
        `Claim/${request.claim.id}`
      : "Claim/unspecified";
    const paId = options?.paId ?? randomUUID();

    const reasonCodes: FHIRCodeableConcept[] = cmsDenialDetails.map((d) => ({
      coding: [
        {
          system: "https://arka.health/CodeSystem/aaa-simulated",
          code: d.reasonCode,
          display: d.reasonText.slice(0, 180),
        },
      ],
      text: d.reasonText,
    }));

    const response: PASResponse = {
      resourceType: "ClaimResponse",
      id: `pas-response-${paId}`,
      meta: {
        profile: [PAS_CLAIM_RESPONSE_PROFILE],
      },
      status: "active",
      type: request.claim.type,
      use: "preauthorization",
      patient: request.claim.patient,
      created: decisionAt.toISOString(),
      insurer: request.claim.insurer ?? {
        reference: request.coverage.payor?.[0]?.reference ?? "Organization/payer",
      },
      requestor: request.claim.provider,
      request: { reference: claimRef },
      outcome,
      disposition,
      decision,
      reasonCodes,
      appealDeadline: appealEnd,
      decisionTimestamp: decisionAt.toISOString(),
      cmsDenialDetails,
      paId,
      aiieDenialRisk: denialRisk,
      aiieClinicalScore: clinicalScore,
      item: [
        {
          itemSequence: 1,
          adjudication: [
            {
              category: {
                coding: [{ system: ADJUDICATION_SYSTEM, code: "submitted", display: "Submitted" }],
              },
              reason:
                decision === "approved" ?
                  {
                    coding: [{ system: ADJUDICATION_SYSTEM, code: "eligible", display: "Eligible" }],
                  }
                : {
                    coding: [
                      {
                        system: ADJUDICATION_SYSTEM,
                        code: decision === "denied" ? "denied" : "pending",
                        display: disposition.slice(0, 120),
                      },
                    ],
                    text: cmsDenialDetails[0]?.reasonText ?? disposition,
                  },
            },
            ...(decision === "approved" ?
              [
                {
                  category: {
                    coding: [{ system: ADJUDICATION_SYSTEM, code: "benefit", display: "Benefit" }],
                  },
                  value: 1,
                },
              ]
            : []),
          ],
        },
      ],
    };

    return { data: response, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "submit_pas_failed";
    return {
      data: null,
      error: { code: "PAS_SUBMIT_FAILED", message },
    };
  }
}
