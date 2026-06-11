/**
 * @file writeback.ts
 * @description FHIR ServiceRequest write-back for accepted AIIE suggestions.
 *
 * When a clinician explicitly accepts a CDS suggestion (rail accept click or
 * CDS Hooks feedback), ARKA constructs the optimized ServiceRequest: corrected
 * modality coding from the matched matrix variant, reasonCode completed from
 * the matched scenario's ICD-10, supportingInfo reference to the AIIE evidence
 * URL, and an audit annotation. The write itself happens ONLY from
 * {@link executeWriteback}, which callers must invoke from an explicit user
 * action with the SMART access token — there are no silent writes to orders.
 *
 * All helpers return `{ data, error }` tuples and never throw.
 */

import { ALL_SCENARIOS } from "@/lib/aiie/knowledge-matrix";
import type { Modality, ModalityRating } from "@/lib/aiie/knowledge-matrix";
import { normalizeOrderContext } from "@/lib/aiie/knowledge-matrix";
import { MATRIX_MODALITY_DISPLAY } from "@/lib/cds-platform/cds-hooks/matrix-bridge";
import type {
  Annotation,
  CodeableConcept,
  Coding,
  FHIRServiceRequest,
  Reference,
} from "@/lib/cds-platform/fhir/resources";
import { evidenceUrl } from "@/lib/evidence/url";
import type { AIIEInput, AIIELibError, AIIEScore } from "@/lib/types/aiie";

/** `{ data, error }` tuple used by every helper in this module. */
export type WritebackResult<T> =
  | { data: T; error: null }
  | { data: null; error: AIIELibError };

/** ARKA code system stamped onto AIIE-normalized modality codings. */
export const ARKA_MODALITY_SYSTEM =
  "https://arkahealth.com/fhir/CodeSystem/aiie-modality";

/** ICD-10-CM code system used when completing reasonCode from the matrix. */
export const ICD10_CM_SYSTEM = "http://hl7.org/fhir/sid/icd-10-cm";

/**
 * Builds the audit annotation text stamped onto every written-back order.
 *
 * @param matrixVersion - Knowledge matrix semver from the score's matrix match.
 */
export function writebackNoteText(matrixVersion: string): string {
  return `Order optimized by AIIE v${matrixVersion} — clinician approved`;
}

/** Modality correction derived from the matched matrix variant. */
export interface CorrectedModality {
  /** Matrix modality code (e.g. `mri`). */
  code: Modality;
  /** Human-readable modality display (e.g. `MRI`). */
  display: string;
  /**
   * True when the matrix's preferred modality differs from the ordered one —
   * the suggestion the clinician accepted changes the study.
   */
  changedFromOrdered: boolean;
}

/** Fully constructed write-back payload plus provenance for audit/UI. */
export interface WritebackBuild {
  /** Updated ServiceRequest ready for `PUT {base}/ServiceRequest/{id}`. */
  resource: FHIRServiceRequest;
  /** Modality stamped onto the order (corrected or affirmed). */
  modality: CorrectedModality;
  /** ICD-10 code added to reasonCode, or null when already coded. */
  icd10Added: string | null;
  /** Absolute AIIE evidence URL referenced from supportingInfo. */
  evidenceReference: string;
  /** Exact annotation text appended to the order. */
  noteText: string;
}

/** Inputs for constructing the write-back payload. */
export interface WritebackBuildInput {
  /** Original ServiceRequest as read from the EHR. */
  serviceRequest: FHIRServiceRequest;
  /** AIIE input the order was scored with (drives modality normalization). */
  aiieInput: AIIEInput;
  /** AIIE score carrying the matrix match provenance. */
  score: AIIEScore;
  /** ISO timestamp of the clinician's accept action. */
  acceptedAtISO: string;
}

function findVariantRatings(
  scenarioId: string,
  variantId: string | null,
): ModalityRating[] {
  if (!variantId) return [];
  const scenario = ALL_SCENARIOS.find((s) => s.id === scenarioId);
  const variant = scenario?.variants.find((v) => v.id === variantId);
  return variant?.ratings ?? [];
}

function resolveModality(
  aiieInput: AIIEInput,
  scenarioId: string,
  variantId: string | null,
): CorrectedModality | null {
  const ordered = normalizeOrderContext(aiieInput).modality;
  const ratings = findVariantRatings(scenarioId, variantId);
  const orderedRating = ordered
    ? ratings.find((r) => r.modality === ordered)
    : undefined;
  const preferred = ratings.find((r) => r.isPreferred);

  // Correct to the variant's preferred modality only when it is strictly
  // better-rated than the ordered study; otherwise affirm the ordered modality.
  if (
    preferred &&
    preferred.modality !== ordered &&
    (!orderedRating || preferred.rating > orderedRating.rating)
  ) {
    return {
      code: preferred.modality,
      display: MATRIX_MODALITY_DISPLAY[preferred.modality],
      changedFromOrdered: true,
    };
  }
  if (ordered) {
    return {
      code: ordered,
      display: MATRIX_MODALITY_DISPLAY[ordered],
      changedFromOrdered: false,
    };
  }
  return null;
}

function hasIcd10Coding(reasonCode: CodeableConcept[] | undefined): boolean {
  return (reasonCode ?? []).some((cc) =>
    (cc.coding ?? []).some((c) => (c.system ?? "").toLowerCase().includes("icd-10")),
  );
}

/**
 * Constructs the optimized ServiceRequest for an accepted AIIE suggestion.
 * Pure function — the original resource is never mutated, and nothing is sent
 * to the EHR until {@link executeWriteback} is called from an explicit accept.
 *
 * @param input - Original order, scoring input, score, and accept timestamp.
 */
export function buildWritebackServiceRequest(
  input: WritebackBuildInput,
): WritebackResult<WritebackBuild> {
  const { serviceRequest, aiieInput, score, acceptedAtISO } = input;

  if (!serviceRequest.id) {
    return {
      data: null,
      error: { code: "missing_order_id", message: "ServiceRequest has no id to write back to" },
    };
  }
  const match = score.matrixMatch;
  if (!match) {
    return {
      data: null,
      error: {
        code: "no_matrix_match",
        message: "Score carries no matrix match — write-back requires matrix provenance",
      },
    };
  }

  const scenario = ALL_SCENARIOS.find((s) => s.id === match.scenarioId) ?? null;
  const modality = resolveModality(aiieInput, match.scenarioId, match.variantId);
  const evidenceReference = evidenceUrl(match.evidenceSlug);
  const noteText = writebackNoteText(match.matrixVersion);

  // 1. Corrected/affirmed modality coding (ARKA code system, CPT codings kept).
  const code: CodeableConcept | undefined = serviceRequest.code
    ? { ...serviceRequest.code, coding: [...(serviceRequest.code.coding ?? [])] }
    : undefined;
  if (code && modality) {
    const arkaCoding: Coding = {
      system: ARKA_MODALITY_SYSTEM,
      code: modality.code,
      display: modality.display,
    };
    code.coding = [
      ...(code.coding ?? []).filter((c) => c.system !== ARKA_MODALITY_SYSTEM),
      arkaCoding,
    ];
    if (modality.changedFromOrdered) {
      const bodyPart = aiieInput.order.bodyPart;
      code.text = bodyPart ? `${modality.display} — ${bodyPart}` : modality.display;
    }
  }

  // 2. reasonCode completed from the matched scenario's ICD-10 (category prefix).
  const reasonCode: CodeableConcept[] = (serviceRequest.reasonCode ?? []).map((cc) => ({
    ...cc,
    coding: cc.coding ? [...cc.coding] : undefined,
  }));
  let icd10Added: string | null = null;
  const icd10 = scenario?.icd10Prefixes[0];
  if (icd10 && !hasIcd10Coding(serviceRequest.reasonCode)) {
    const icdCoding: Coding = { system: ICD10_CM_SYSTEM, code: icd10, display: scenario.name };
    if (reasonCode.length > 0) {
      reasonCode[0] = { ...reasonCode[0], coding: [...(reasonCode[0].coding ?? []), icdCoding] };
    } else {
      reasonCode.push({ coding: [icdCoding], text: scenario.name });
    }
    icd10Added = icd10;
  }

  // 3. supportingInfo reference to the first-party AIIE evidence page.
  const evidenceRef: Reference = {
    reference: evidenceReference,
    display: `AIIE evidence basis${scenario ? `: ${scenario.name}` : ""}`,
  };
  const supportingInfo: Reference[] = [
    ...(serviceRequest.supportingInfo ?? []).filter(
      (ref) => ref.reference !== evidenceReference,
    ),
    evidenceRef,
  ];

  // 4. Audit annotation — explicit clinician approval, matrix version stamped.
  const note: Annotation[] = [
    ...(serviceRequest.note ?? []),
    { authorString: "ARKA AIIE", time: acceptedAtISO, text: noteText },
  ];

  const resource: FHIRServiceRequest = {
    ...serviceRequest,
    ...(code ? { code } : {}),
    ...(reasonCode.length > 0 ? { reasonCode } : {}),
    supportingInfo,
    note,
  };

  return {
    data: {
      resource,
      modality: modality ?? { code: "xr", display: "X-ray", changedFromOrdered: false },
      icd10Added,
      evidenceReference,
      noteText,
    },
    error: null,
  };
}

/** SMART session fields required to authorize the write-back. */
export interface WritebackSession {
  /** FHIR server base URL the session token is valid against. */
  fhirBaseUrl: string;
  /** OAuth2 access token from the SMART EHR launch. */
  accessToken: string;
}

const WRITEBACK_TIMEOUT_MS = 8_000;

/**
 * PUTs the optimized ServiceRequest back to the EHR's FHIR server using the
 * SMART access token. Must only be invoked from an explicit clinician action
 * (the accept click) — never call this from render or scoring paths.
 *
 * @param session - SMART session (FHIR base URL + access token).
 * @param resource - Updated ServiceRequest from {@link buildWritebackServiceRequest}.
 */
export async function executeWriteback(
  session: WritebackSession,
  resource: FHIRServiceRequest,
): Promise<WritebackResult<{ status: number }>> {
  if (!resource.id) {
    return {
      data: null,
      error: { code: "missing_order_id", message: "ServiceRequest has no id to write back to" },
    };
  }
  const base = session.fhirBaseUrl.replace(/\/+$/, "");
  const url = `${base}/ServiceRequest/${encodeURIComponent(resource.id)}`;
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/fhir+json",
        Accept: "application/fhir+json",
      },
      body: JSON.stringify(resource),
      signal: AbortSignal.timeout(WRITEBACK_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        data: null,
        error: { code: "writeback_http", message: `FHIR server returned ${res.status}` },
      };
    }
    return { data: { status: res.status }, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        code: "writeback_failed",
        message: err instanceof Error ? err.message : "write-back request failed",
      },
    };
  }
}
