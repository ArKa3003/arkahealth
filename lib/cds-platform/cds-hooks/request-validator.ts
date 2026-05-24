/**
 * @file request-validator.ts
 * @description Validates incoming CDS Hooks request body (hook, hookInstance, context, prefetch)
 *   using Zod. Ensures required fields and types for order-select and order-sign.
 */

import type { CDSHooksRequest, CDSHooksRequestValidated } from './types';
import type { FHIRBundle, FHIRServiceRequest } from '../fhir/resources';
import { cdSHooksRequestSchema, safeValidateCDSHooksRequest } from './types';

/** Re-export schema and validated type for consumers that import from request-validator */
export { cdSHooksRequestSchema };
export type CdsHooksRequestInput = CDSHooksRequestValidated;

/** Supported hook IDs for our imaging services */
const SUPPORTED_HOOK_IDS = ['order-select', 'order-sign'] as const;

function getBundleResources<T>(bundle: FHIRBundle<T> | null | undefined): T[] {
  if (!bundle?.entry?.length) return [];
  return bundle.entry.map((e) => e?.resource).filter((r): r is T => r != null);
}

/** Check if a coding represents imaging (CPT radiology 70xxx-79xxx or SNOMED imaging procedure). */
function isImagingCoding(system: string | undefined, code: string | undefined): boolean {
  if (!code) return false;
  const sys = (system ?? '').toLowerCase();
  const c = code.trim();
  if (sys.includes('cpt') || sys.includes('ama-assn')) {
    const num = parseInt(c, 10);
    if (Number.isFinite(num) && num >= 70000 && num <= 79999) return true;
  }
  if (sys.includes('snomed')) {
    const imagingSnomed = ['363787002', '363680008', '241541005', '59241006', '77477000', '387713003'];
    if (imagingSnomed.some((s) => c === s || c.startsWith(s))) return true;
  }
  return false;
}

/** Check if ServiceRequest has imaging-relevant category or code. */
function isImagingServiceRequest(sr: FHIRServiceRequest): boolean {
  const codings = [
    ...(sr?.code?.coding ?? []),
    ...(sr?.category ?? []).flatMap((cat) => cat?.coding ?? []),
  ];
  return codings.some((c) => isImagingCoding(c.system, c.code));
}

/** Get imaging-relevant ServiceRequests from a draftOrders bundle. */
export function getImagingDraftOrders(
  draftOrders: FHIRBundle<FHIRServiceRequest> | null | undefined
): FHIRServiceRequest[] {
  const resources = getBundleResources(draftOrders ?? null) as FHIRServiceRequest[];
  return resources.filter(isImagingServiceRequest);
}

/**
 * Validates the request body as a CDS Hooks request.
 * @param body - Parsed JSON body from POST
 * @returns Parsed and validated request (hook, hookInstance, context with userId, patientId, draftOrders)
 * @throws ZodError when validation fails
 */
export function validateCdsHooksRequest(
  body: unknown
): CDSHooksRequest & CDSHooksRequestValidated {
  return cdSHooksRequestSchema.parse(body) as CDSHooksRequest & CDSHooksRequestValidated;
}

/**
 * Validates request body and returns a result object with valid flag, request, or errors.
 * Validates: hook is supported, context has required fields, draftOrders contains at least one imaging-relevant ServiceRequest.
 */
export function validateCDSRequest(body: unknown): {
  valid: boolean;
  request?: CDSHooksRequest;
  errors?: string[];
} {
  const parsed = safeValidateCDSHooksRequest(body);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const messages = ([] as string[]).concat(
      ...Object.entries(errors).map(([k, v]) => (Array.isArray(v) ? v : [v]).map((m) => `${k}: ${m}`))
    );
    return { valid: false, errors: messages.length ? messages : ['Validation failed'] };
  }

  const request = parsed.data as unknown as CDSHooksRequest;

  if (!SUPPORTED_HOOK_IDS.includes(request.hook as (typeof SUPPORTED_HOOK_IDS)[number])) {
    return {
      valid: false,
      errors: [`Unsupported hook: ${request.hook}. Supported: ${SUPPORTED_HOOK_IDS.join(', ')}`],
    };
  }

  const draftOrders = request.context?.draftOrders;
  const resources = getBundleResources(
    draftOrders as FHIRBundle<FHIRServiceRequest> | null | undefined
  ) as FHIRServiceRequest[];
  const hasImaging = resources.some(isImagingServiceRequest);
  if (!hasImaging) {
    return {
      valid: false,
      errors: ['draftOrders must contain at least one imaging-relevant ServiceRequest'],
    };
  }

  return { valid: true, request };
}

/**
 * Validates that context contains patientId (required for our hooks).
 */
export function requirePatientId(context: Record<string, unknown>): void {
  if (!context.patientId || typeof context.patientId !== 'string') {
    throw new Error('context.patientId is required');
  }
}

export { safeValidateCDSHooksRequest };
