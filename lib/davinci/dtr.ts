/**
 * Da Vinci DTR (Documentation Templates and Rules) — CQL-lite Questionnaire generation
 * from AIIE factor output. Produces FHIR R4 Questionnaire resources suitable for EHR validators.
 */

import { scoreOrder } from "@/lib/aiie/scoring-engine";
import { parseCoverage } from "@/lib/fhir/coverage";
import type { ParsedCoverage } from "@/lib/fhir/coverage";
import type { AIIEInput, AIIEScore, AIIEFactor } from "@/lib/types/aiie";
import type { DTRQuestionnaire } from "@/lib/types/davinci";
import type {
  Coverage,
  FHIRExtension,
  Questionnaire,
  QuestionnaireItem,
  QuestionnaireItemInitial,
  QuestionnaireResponse,
  QuestionnaireResponseItem,
  ServiceRequest,
} from "@/lib/types/fhir";

/** Placeholder canonical Library reference for CQL-lite rules (Epic DTR / CQF). */
export const ARKA_DTR_LIBRARY_CANONICAL =
  "http://arka.health/fhir/Library/arka-aiie-dtr|0.1.0";

/** HL7 CQF library extension URL (FHIR R4). */
export const EXT_CQF_LIBRARY = "http://hl7.org/fhir/StructureDefinition/cqf-library";

/** ARKA extension: stable AIIE factor identifier on each Questionnaire item. */
export const EXT_AIIE_FACTOR_ID =
  "https://arka.health/fhir/StructureDefinition/aiie-factor-id";

const FDA_NON_DEVICE_DISCLAIMER =
  "This recommendation is provided by ARKA Imaging Intelligence Engine, an FDA Non-Device Clinical Decision Support tool under the 21st Century Cures Act. The ordering clinician retains full responsibility for the final decision.";

/**
 * Returns true when this factor should surface as a DTR documentation item.
 *
 * @param factor - AIIE factor row from {@link AIIEScore}.
 */
export function isDtrFactorCandidate(factor: AIIEFactor): boolean {
  return factor.contribution < 0 || factor.present === undefined;
}

/**
 * Builds prefetch-backed initial value strings for a factor when ServiceRequest / Coverage data apply.
 *
 * @param coverage - Parsed coverage from prefetch.
 * @param serviceRequest - Ordering ServiceRequest from prefetch.
 * @param factorId - AIIE factor identifier.
 * @returns Initial string when inferable; otherwise undefined.
 */
export function extractPrefetchInitials(
  coverage: ParsedCoverage,
  serviceRequest: ServiceRequest,
  factorId: string,
): string | undefined {
  const codeText =
    serviceRequest.code?.text?.trim() ||
    serviceRequest.code?.coding?.find((c) => c.display?.trim())?.display?.trim() ||
    serviceRequest.code?.coding?.find((c) => c.code)?.code;
  const reason0 =
    serviceRequest.reasonCode?.[0]?.text?.trim() ||
    serviceRequest.reasonCode?.[0]?.coding?.[0]?.display;
  const note0 = serviceRequest.note?.[0]?.text?.trim();

  switch (factorId) {
    case "clinical_indication": {
      const parts = [codeText, reason0].filter(Boolean);
      return parts.length > 0 ? parts.join(" — ") : undefined;
    }
    case "prior_imaging_redundancy":
      return note0 ?? reason0;
    case "red_flag_symptoms":
      return reason0;
    case "guideline_alignment":
      return note0;
    case "patient_risk_factors": {
      const member = coverage.memberId ? `Member: ${coverage.memberId}` : undefined;
      const plan = coverage.planName ?? coverage.planId;
      return [member, plan ? `Plan: ${plan}` : undefined].filter(Boolean).join("; ") || undefined;
    }
    case "radiation_exposure":
      return codeText;
    default:
      return undefined;
  }
}

function appendDisclaimer(text: string): string {
  const t = text.trim();
  if (t.includes("FDA Non-Device Clinical Decision Support")) {
    return t;
  }
  return `${t} ${FDA_NON_DEVICE_DISCLAIMER}`;
}

function cqlLibraryExtensions(): FHIRExtension[] {
  return [
    {
      url: EXT_CQF_LIBRARY,
      valueCanonical: ARKA_DTR_LIBRARY_CANONICAL,
    },
  ];
}

function factorExtensions(factorId: string): FHIRExtension[] {
  return [
    ...cqlLibraryExtensions(),
    {
      url: EXT_AIIE_FACTOR_ID,
      valueString: factorId,
    },
  ];
}

function pickItemType(
  factor: AIIEFactor,
): "boolean" | "string" | "choice" | "quantity" {
  if (factor.present === undefined) {
    return "string";
  }
  if (factor.id === "guideline_alignment" && factor.contribution < 0) {
    return "choice";
  }
  if (factor.id === "radiation_exposure") {
    return "quantity";
  }
  if (factor.contribution < 0) {
    return "boolean";
  }
  return "string";
}

function buildQuestionText(factor: AIIEFactor, itemType: string): string {
  if (factor.present === undefined) {
    return appendDisclaimer(
      `Document clinical details for: ${factor.name}. Evidence: ${factor.evidenceCitation}`,
    );
  }
  if (itemType === "quantity") {
    return appendDisclaimer(
      `Enter estimated effective dose context (mSv) or related documentation reference for: ${factor.name}.`,
    );
  }
  if (itemType === "choice") {
    return appendDisclaimer(
      `Indicate whether conservative care documentation is complete for: ${factor.name}.`,
    );
  }
  if (itemType === "boolean") {
    return appendDisclaimer(
      `Confirm documentation in the record addresses payer concerns for: ${factor.name} (current modeled contribution ${factor.contribution.toFixed(3)}).`,
    );
  }
  return appendDisclaimer(`Provide additional documentation for: ${factor.name}.`);
}

function buildInitial(
  coverage: ParsedCoverage,
  serviceRequest: ServiceRequest,
  factorId: string,
  itemType: string,
): QuestionnaireItemInitial[] | undefined {
  const s = extractPrefetchInitials(coverage, serviceRequest, factorId);
  if (itemType === "quantity") {
    return undefined;
  }
  if (!s?.trim()) {
    return undefined;
  }
  return [{ valueString: s }];
}

function buildAnswerOptions(itemType: string): QuestionnaireItem["answerOption"] | undefined {
  if (itemType !== "choice") {
    return undefined;
  }
  return [
    { valueString: "Yes" },
    { valueString: "No" },
    { valueString: "Not applicable" },
  ];
}

/**
 * Converts AIIE output into a FHIR R4 Questionnaire with Da Vinci-style CQF and ARKA factor extensions.
 *
 * @param aiie - Latest AIIE score including factor rows.
 * @param coverage - Parsed Coverage from prefetch for initial values.
 * @param serviceRequest - ServiceRequest from prefetch for procedure and indication context.
 */
export function generateQuestionnaire(
  aiie: AIIEScore,
  coverage: ParsedCoverage,
  serviceRequest: ServiceRequest,
): DTRQuestionnaire {
  const factors = aiie.factors.filter(isDtrFactorCandidate);
  const seen = new Set<string>();
  const items: QuestionnaireItem[] = [];

  for (const factor of factors) {
    if (seen.has(factor.id)) {
      continue;
    }
    seen.add(factor.id);
    const itemType = pickItemType(factor);
    const required = factor.present === undefined || factor.contribution < 0;
    const linkId = `aiie-${factor.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
    const initial = buildInitial(coverage, serviceRequest, factor.id, itemType);

    const item: QuestionnaireItem = {
      linkId,
      type: itemType,
      required,
      text: buildQuestionText(factor, itemType),
      extension: factorExtensions(factor.id),
      answerOption: buildAnswerOptions(itemType),
    };
    if (initial?.length) {
      item.initial = initial;
    }
    items.push(item);
  }

  const qId =
    serviceRequest.id?.trim() ||
    serviceRequest.identifier?.find((i) => i.value?.trim())?.value ||
    "order";

  const questionnaire: DTRQuestionnaire = {
    resourceType: "Questionnaire",
    id: `arka-aiie-dtr-${qId}`,
    url: `https://arka.health/fhir/Questionnaire/aiie-dtr/${encodeURIComponent(qId)}`,
    version: "0.1.0",
    name: "ArkaAIIEDocumentationQuestionnaire",
    title: appendDisclaimer("ARKA AIIE documentation (DTR CQL-lite)"),
    status: "active",
    subjectType: ["Patient"],
    extension: cqlLibraryExtensions(),
    item: items as DTRQuestionnaire["item"],
  };

  return questionnaire;
}

/** Order context used to rebuild AIIE scoring and DTR questionnaires from API requests. */
export interface DtrOrderContext {
  /** AIIE input for scoring. */
  aiieInput: AIIEInput;
  /** FHIR ServiceRequest for the order. */
  serviceRequest: ServiceRequest;
  /** Structured coverage view. */
  parsedCoverage: ParsedCoverage;
  /** Raw Coverage when provided (optional). */
  coverageResource?: Coverage;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Builds a deterministic demo AIIE input when callers do not supply `context` query JSON.
 *
 * @param orderId - Route order identifier.
 */
export function buildDemoAiieInput(orderId: string): AIIEInput {
  const h = hashString(orderId);
  const age = 35 + (h % 45);
  const modalities: AIIEInput["requestedModality"][] = ["MRI", "CT", "Ultrasound", "X-ray"];
  const modality = modalities[h % modalities.length];
  const chief = `Imaging order ${orderId}: musculoskeletal evaluation`;
  const clinicalFactors: AIIEInput["clinicalFactors"] = {
    chiefComplaint: chief,
    duration: "4 weeks",
    symptoms: ["pain", "limited range of motion"],
    redFlags: {
      cancerHistory: false,
      neurologicalDeficit: (h % 7) === 0,
      fever: false,
      weightLoss: false,
      trauma: false,
      immunocompromised: false,
      ivDrugUse: false,
      osteoporosis: false,
      ageOver50: age > 50,
      ageUnder18: age < 18,
      progressiveSymptoms: (h % 5) === 0,
      bladderBowelDysfunction: false,
      suddenOnset: false,
    },
    priorImaging: (h % 3) !== 0,
    priorImagingTimeframe: (h % 3) !== 0 ? "6 months" : undefined,
    conservativeManagementTried: (h % 4) !== 0,
    conservativeManagementDuration: (h % 4) !== 0 ? "6 weeks PT" : undefined,
  };
  return {
    patient: { age, sex: (h % 2) === 0 ? "male" : "female" },
    clinicalFactors,
    order: {
      modality,
      procedure: `${modality} study`,
      cpt: "72148",
      bodyPart: "lumbar spine",
    },
    coverage: {
      payerName: "Demo Payer",
      payerId: "demo-payer",
      planName: "PPO",
    },
    age,
    sex: (h % 2) === 0 ? "male" : "female",
    pregnant: false,
    chiefComplaint: chief,
    duration: clinicalFactors.duration,
    symptoms: clinicalFactors.symptoms,
    redFlags: clinicalFactors.redFlags,
    priorImaging: clinicalFactors.priorImaging,
    priorImagingTimeframe: clinicalFactors.priorImagingTimeframe,
    conservativeManagementTried: clinicalFactors.conservativeManagementTried,
    conservativeManagementDuration: clinicalFactors.conservativeManagementDuration,
    requestedModality: modality,
    requestedProcedure: `${modality} lumbar`,
  };
}

function safeJsonParse<T>(raw: string): { data: T | null; error: string | null } {
  try {
    return { data: JSON.parse(raw) as T, error: null };
  } catch {
    return { data: null, error: "Invalid JSON payload" };
  }
}

/**
 * Resolves DTR order context from `context` (base64url JSON) or demo defaults.
 *
 * Expected JSON shape: `{ "aiieInput"?: AIIEInput, "serviceRequest": ServiceRequest, "coverage"?: Coverage }`
 *
 * @param orderId - Path order id.
 * @param contextB64 - Optional base64url-encoded JSON context.
 */
export function resolveDtrOrderContext(
  orderId: string,
  contextB64: string | null | undefined,
): { data: DtrOrderContext | null; error: string | null } {
  if (contextB64?.trim()) {
    let json: string;
    try {
      const pad = contextB64.length % 4 === 0 ? "" : "=".repeat(4 - (contextB64.length % 4));
      json = Buffer.from(contextB64.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64").toString(
        "utf8",
      );
    } catch {
      return { data: null, error: "Invalid base64 context" };
    }
    const parsed = safeJsonParse<{
      aiieInput?: AIIEInput;
      serviceRequest?: ServiceRequest;
      coverage?: Coverage;
    }>(json);
    if (parsed.error || !parsed.data?.serviceRequest) {
      return { data: null, error: parsed.error ?? "serviceRequest required in context" };
    }
    const sr = parsed.data.serviceRequest;
    const aiieInput = parsed.data.aiieInput ?? buildDemoAiieInput(orderId);
    const covRes = parsed.data.coverage;
    const parsedCoverage = covRes ? parseCoverage(covRes) : demoParsedCoverage(orderId);
    return {
      data: {
        aiieInput,
        serviceRequest: sr,
        parsedCoverage,
        coverageResource: covRes,
      },
      error: null,
    };
  }

  const aiieInput = buildDemoAiieInput(orderId);
  const serviceRequest: ServiceRequest = {
    resourceType: "ServiceRequest",
    id: orderId,
    intent: "order",
    status: "active",
    subject: { reference: `Patient/demo-${hashString(orderId) % 10000}` },
    code: {
      text: aiieInput.order.procedure,
      coding: aiieInput.order.cpt ?
        [{ system: "http://www.ama-assn.org/go/cpt", code: aiieInput.order.cpt, display: aiieInput.order.procedure }]
      : undefined,
    },
  };
  return {
    data: {
      aiieInput,
      serviceRequest,
      parsedCoverage: demoParsedCoverage(orderId),
    },
    error: null,
  };
}

function demoParsedCoverage(orderId: string): ParsedCoverage {
  const h = hashString(orderId);
  return {
    payerId: `demo-payer-${h % 100}`,
    payerName: "Demo Payer",
    planName: "Open Access PPO",
    memberId: `M-${h % 100000}`,
    confidence: 0.55 + (h % 40) / 100,
  };
}

/**
 * Flattens nested Questionnaire items for validation.
 *
 * @param items - Questionnaire items tree.
 */
export function flattenQuestionnaireItems(items?: QuestionnaireItem[]): QuestionnaireItem[] {
  if (!items?.length) {
    return [];
  }
  const out: QuestionnaireItem[] = [];
  for (const it of items) {
    out.push(it);
    if (it.item?.length) {
      out.push(...flattenQuestionnaireItems(it.item));
    }
  }
  return out;
}

/**
 * Flattens nested QuestionnaireResponse items.
 *
 * @param items - Response item tree.
 */
export function flattenQuestionnaireResponseItems(
  items?: QuestionnaireResponseItem[],
): QuestionnaireResponseItem[] {
  if (!items?.length) {
    return [];
  }
  const out: QuestionnaireResponseItem[] = [];
  for (const it of items) {
    out.push(it);
    if (it.item?.length) {
      out.push(...flattenQuestionnaireResponseItems(it.item));
    }
  }
  return out;
}

function readFactorIdFromItem(item: QuestionnaireItem): string | undefined {
  const ext = item.extension?.find((e) => e.url === EXT_AIIE_FACTOR_ID);
  if (ext?.valueString?.trim()) {
    return ext.valueString.trim();
  }
  if (item.linkId?.startsWith("aiie-")) {
    return item.linkId.slice(5);
  }
  return undefined;
}

/**
 * Returns whether every required Questionnaire item has a non-empty answer in the response.
 *
 * @param questionnaire - Generated questionnaire definition.
 * @param response - Submitted QuestionnaireResponse.
 */
export function validateRequiredItemsAnswered(
  questionnaire: Questionnaire,
  response: QuestionnaireResponse,
): { ok: boolean; missingLinkIds: string[] } {
  const defs = flattenQuestionnaireItems(questionnaire.item).filter((i) => i.required);
  const answers = flattenQuestionnaireResponseItems(response.item);
  const byLink = new Map(answers.map((a) => [a.linkId, a]));
  const missing: string[] = [];
  for (const def of defs) {
    const row = byLink.get(def.linkId);
    if (!row?.answer?.length) {
      missing.push(def.linkId);
      continue;
    }
    const a = row.answer[0];
    const hasValue =
      a.valueString != null ||
      a.valueBoolean != null ||
      a.valueInteger != null ||
      a.valueDecimal != null ||
      a.valueDate != null ||
      a.valueDateTime != null ||
      a.valueCoding != null ||
      a.valueReference != null ||
      a.valueQuantity?.value != null;
    if (!hasValue) {
      missing.push(def.linkId);
    }
  }
  return { ok: missing.length === 0, missingLinkIds: missing };
}

function readAnswerValue(item: QuestionnaireResponseItem): {
  bool?: boolean;
  str?: string;
  num?: number;
} {
  const a = item.answer?.[0];
  if (!a) {
    return {};
  }
  if (a.valueBoolean != null) {
    return { bool: a.valueBoolean };
  }
  if (a.valueString != null && a.valueString.trim() !== "") {
    return { str: a.valueString.trim() };
  }
  if (a.valueInteger != null) {
    return { num: a.valueInteger };
  }
  if (a.valueDecimal != null) {
    return { num: a.valueDecimal };
  }
  if (a.valueQuantity?.value != null) {
    return { num: a.valueQuantity.value };
  }
  return {};
}

/**
 * Merges documented answers back into an AIIE input for rescoring.
 *
 * @param base - Baseline AIIE input from the same session as the Questionnaire.
 * @param questionnaire - Questionnaire used to author the response (for factor mapping).
 * @param response - Submitted QuestionnaireResponse.
 */
export function applyQuestionnaireResponseToInput(
  base: AIIEInput,
  questionnaire: Questionnaire,
  response: QuestionnaireResponse,
): AIIEInput {
  const qItems = flattenQuestionnaireItems(questionnaire.item);
  const byLink = new Map(qItems.map((q) => [q.linkId, q]));
  const merged: AIIEInput = {
    ...base,
    clinicalFactors: { ...base.clinicalFactors, redFlags: { ...base.clinicalFactors.redFlags } },
    redFlags: { ...base.redFlags },
  };

  for (const ans of flattenQuestionnaireResponseItems(response.item)) {
    const q = byLink.get(ans.linkId);
    if (!q) {
      continue;
    }
    const factorId = readFactorIdFromItem(q);
    if (!factorId) {
      continue;
    }
    const v = readAnswerValue(ans);
    const doc = v.str ?? (v.bool === true ? "Documented via DTR." : v.bool === false ? "" : undefined);
    switch (factorId) {
      case "clinical_indication":
        if (doc) {
          merged.chiefComplaint = `${merged.chiefComplaint}\n${doc}`;
          merged.clinicalFactors.chiefComplaint = `${merged.clinicalFactors.chiefComplaint}\n${doc}`;
        }
        break;
      case "prior_imaging_redundancy":
        if (doc) {
          merged.clinicalFactors.priorImagingTimeframe = doc;
          merged.priorImagingTimeframe = doc;
        }
        if (v.bool === true) {
          merged.clinicalFactors.priorImaging = true;
          merged.priorImaging = true;
        }
        break;
      case "red_flag_symptoms":
        if (v.bool === true) {
          merged.clinicalFactors.redFlags.progressiveSymptoms = true;
          merged.redFlags.progressiveSymptoms = true;
        }
        if (doc) {
          merged.symptoms = [...merged.symptoms, doc];
          merged.clinicalFactors.symptoms = [...merged.clinicalFactors.symptoms, doc];
        }
        break;
      case "guideline_alignment": {
        const yes =
          v.bool === true ||
          (v.str != null && /^yes$/i.test(v.str)) ||
          (doc != null && doc.length > 10);
        if (yes) {
          merged.clinicalFactors.conservativeManagementTried = true;
          merged.conservativeManagementTried = true;
          merged.clinicalFactors.conservativeManagementDuration =
            merged.clinicalFactors.conservativeManagementDuration ?? "Documented per DTR";
          merged.conservativeManagementDuration =
            merged.conservativeManagementDuration ?? "Documented per DTR";
        }
        break;
      }
      case "patient_risk_factors":
        if (v.bool === true) {
          merged.clinicalFactors.redFlags.immunocompromised = true;
          merged.redFlags.immunocompromised = true;
        }
        break;
      case "radiation_exposure":
        if (v.num != null || doc) {
          merged.chiefComplaint = `${merged.chiefComplaint} Radiation discussion documented.`;
          merged.clinicalFactors.chiefComplaint = `${merged.clinicalFactors.chiefComplaint} Radiation discussion documented.`;
        }
        break;
      default:
        if (doc) {
          merged.chiefComplaint = `${merged.chiefComplaint}\n${doc}`;
        }
    }
  }

  return merged;
}

/**
 * Runs AIIE scoring on a resolved order context.
 *
 * @param ctx - Resolved DTR order context.
 */
export async function scoreOrderContext(ctx: DtrOrderContext): Promise<AIIEScore> {
  return scoreOrder(ctx.aiieInput);
}
