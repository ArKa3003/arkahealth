/**
 * @file request-validator.ts
 * @description Validates the full CDS Hooks 2.0 request shape (hook, hookInstance UUID,
 *   per-hook context, prefetch) with Zod. Invalid requests NEVER 500 into an EHR:
 *   callers respond HTTP 200 with an empty cards array plus an OperationOutcome-style
 *   extension built by {@link invalidRequestResponse}, and the failure is logged via
 *   pino with the hookInstance correlation id.
 */

import pino from 'pino';
import { z } from 'zod';
import type { CDSHooksRequest, CDSHooksResponse } from './types';
import type { FHIRBundle, FHIRServiceRequest } from '../fhir/resources';

// CDS Hooks security-model JWT validation lives in a sibling, edge-safe module
// (no pino) so middleware can import it directly; re-exported here for callers
// that treat this file as the validation entry point. Enforced when
// CDS_JWT_REQUIRED=1 — local demos keep working without keys.
export { isCdsJwtRequired, verifyCdsHooksJwt } from './jwt-validator';
export type { CdsJwtError, CdsJwtResult } from './jwt-validator';

const logger = pino({
  name: 'cds-hooks-request-validator',
  level: process.env.LOG_LEVEL ?? 'info',
});

/** Hook ids accepted by the ARKA CDS services. */
export const SUPPORTED_HOOK_IDS = [
  'order-select',
  'order-sign',
  'appointment-book',
  'patient-view',
  'encounter-start',
] as const;

export type SupportedHookId = (typeof SUPPORTED_HOOK_IDS)[number];

// -----------------------------------------------------------------------------
// Zod schemas — CDS Hooks 2.0 request shape
// -----------------------------------------------------------------------------

const uuidSchema = z.uuid({ error: 'hookInstance must be a valid UUID' });

/** Minimal FHIR Bundle: resourceType "Bundle", valid type, optional entries. */
const fhirBundleSchema = z.looseObject({
  resourceType: z.literal('Bundle'),
  type: z.enum([
    'document',
    'message',
    'transaction',
    'transaction-response',
    'batch',
    'batch-response',
    'history',
    'searchset',
    'collection',
  ]),
  entry: z.array(z.record(z.string(), z.unknown())).optional(),
});

/** order-select / order-sign context: userId, patientId, draftOrders Bundle. */
const orderContextSchema = z.looseObject({
  userId: z.string().min(1, 'context.userId is required'),
  patientId: z.string().min(1, 'context.patientId is required'),
  encounterId: z.string().optional(),
  draftOrders: fhirBundleSchema,
  selections: z.array(z.string()).optional(),
});

/** appointment-book context: userId, patientId, appointments Bundle. */
const appointmentContextSchema = z.looseObject({
  userId: z.string().min(1, 'context.userId is required'),
  patientId: z.string().min(1, 'context.patientId is required'),
  encounterId: z.string().optional(),
  appointments: fhirBundleSchema.optional(),
});

/** patient-view / encounter-start context: userId, patientId. */
const patientContextSchema = z.looseObject({
  userId: z.string().min(1, 'context.userId is required'),
  patientId: z.string().min(1, 'context.patientId is required'),
  encounterId: z.string().optional(),
});

/** CDS Hooks 2.0 fhirAuthorization (snake_case per spec; camelCase tolerated). */
const fhirAuthorizationSchema = z
  .looseObject({
    access_token: z.string().optional(),
    accessToken: z.string().optional(),
    token_type: z.string().optional(),
    tokenType: z.string().optional(),
    expires_in: z.number().optional(),
    expiresIn: z.number().optional(),
    scope: z.string().optional(),
    subject: z.string().optional(),
  })
  .refine((a) => Boolean(a.access_token ?? a.accessToken), {
    message: 'fhirAuthorization.access_token is required',
  });

const baseRequestSchema = z.looseObject({
  hook: z.enum(SUPPORTED_HOOK_IDS, { error: 'hook is not a supported CDS hook' }),
  hookInstance: uuidSchema,
  fhirServer: z.url().optional(),
  fhirAuthorization: fhirAuthorizationSchema.optional(),
  context: z.record(z.string(), z.unknown()),
  prefetch: z.record(z.string(), z.unknown()).optional(),
});

const CONTEXT_SCHEMAS: Record<SupportedHookId, z.ZodType> = {
  'order-select': orderContextSchema,
  'order-sign': orderContextSchema,
  'appointment-book': appointmentContextSchema,
  'patient-view': patientContextSchema,
  'encounter-start': patientContextSchema,
};

// -----------------------------------------------------------------------------
// Imaging draft-order helpers (used by order-select / order-sign handlers)
// -----------------------------------------------------------------------------

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

/**
 * Get every imaging-relevant ServiceRequest from a draftOrders bundle
 * (multiple draft orders → one card per order, each independently scored).
 */
export function getImagingDraftOrders(
  draftOrders: FHIRBundle<FHIRServiceRequest> | null | undefined,
): FHIRServiceRequest[] {
  const resources = getBundleResources(draftOrders ?? null) as FHIRServiceRequest[];
  return resources.filter(
    (r) => (r as { resourceType?: string })?.resourceType === 'ServiceRequest' && isImagingServiceRequest(r),
  );
}

// -----------------------------------------------------------------------------
// Validation result + OperationOutcome-style invalid response
// -----------------------------------------------------------------------------

/** Result of validating a CDS Hooks POST body. */
export type CDSRequestValidation =
  | { valid: true; request: CDSHooksRequest; hookInstance: string }
  | { valid: false; errors: string[]; hookInstance: string; response: CDSHooksInvalidResponse };

/** OperationOutcome-style issue carried on the invalid-request extension. */
export interface CDSOperationOutcomeIssue {
  severity: 'error';
  code: 'invalid';
  diagnostics: string;
}

/** HTTP-200 body returned to the EHR for invalid requests (never a 5xx). */
export interface CDSHooksInvalidResponse extends CDSHooksResponse {
  cards: [];
  extension: {
    'arka-operation-outcome': {
      resourceType: 'OperationOutcome';
      issue: CDSOperationOutcomeIssue[];
    };
  };
}

function zodErrorMessages(error: z.ZodError): string[] {
  return error.issues.map((i) => {
    const path = i.path.join('.');
    return path ? `${path}: ${i.message}` : i.message;
  });
}

/**
 * Builds the HTTP-200 invalid-request body: empty cards plus an OperationOutcome-style
 * extension. CDS Hooks services must not surface 5xx errors into an EHR ordering flow.
 *
 * @param errors - Human-readable validation failures.
 */
export function invalidRequestResponse(errors: string[]): CDSHooksInvalidResponse {
  const issues = (errors.length ? errors : ['Invalid CDS Hooks request']).map(
    (diagnostics): CDSOperationOutcomeIssue => ({
      severity: 'error',
      code: 'invalid',
      diagnostics,
    }),
  );
  return {
    cards: [],
    extension: {
      'arka-operation-outcome': {
        resourceType: 'OperationOutcome',
        issue: issues,
      },
    },
  };
}

function bestEffortHookInstance(body: unknown): string {
  if (body && typeof body === 'object') {
    const h = (body as { hookInstance?: unknown }).hookInstance;
    if (typeof h === 'string' && h.trim()) return h.trim();
  }
  return 'unknown';
}

/**
 * Normalizes tolerated camelCase auth fields onto the spec snake_case shape.
 */
function normalizeAuthorization(
  auth: z.infer<typeof fhirAuthorizationSchema> | undefined,
): CDSHooksRequest['fhirAuthorization'] {
  if (!auth) return undefined;
  return {
    access_token: (auth.access_token ?? auth.accessToken) as string,
    token_type: 'Bearer',
    expires_in: auth.expires_in ?? auth.expiresIn ?? 0,
    scope: auth.scope ?? '',
    subject: auth.subject ?? '',
  };
}

/**
 * Validates a CDS Hooks 2.0 POST body: supported hook, UUID hookInstance, per-hook
 * context shape, and prefetch map. On failure, returns the ready-to-send HTTP-200
 * invalid body and logs with the hookInstance correlation id.
 *
 * @param body - Parsed JSON body (or null when JSON parsing itself failed).
 * @param expectedHook - When set, the request's hook must equal this service's hook.
 */
export function validateCDSRequest(
  body: unknown,
  expectedHook?: SupportedHookId,
): CDSRequestValidation {
  const hookInstance = bestEffortHookInstance(body);

  const fail = (errors: string[]): CDSRequestValidation => {
    logger.warn({ hookInstance, errors }, 'Rejected invalid CDS Hooks request');
    return { valid: false, errors, hookInstance, response: invalidRequestResponse(errors) };
  };

  if (body == null || typeof body !== 'object' || Array.isArray(body)) {
    return fail(['Request body must be a JSON object']);
  }

  const base = baseRequestSchema.safeParse(body);
  if (!base.success) {
    return fail(zodErrorMessages(base.error));
  }

  const hook = base.data.hook;
  if (expectedHook && hook !== expectedHook) {
    return fail([`hook: expected "${expectedHook}" for this service, received "${hook}"`]);
  }

  const contextResult = CONTEXT_SCHEMAS[hook].safeParse(base.data.context);
  if (!contextResult.success) {
    return fail(zodErrorMessages(contextResult.error).map((m) => `context.${m}`));
  }

  const request: CDSHooksRequest = {
    hook,
    hookInstance: base.data.hookInstance,
    fhirServer: base.data.fhirServer,
    fhirAuthorization: normalizeAuthorization(base.data.fhirAuthorization),
    context: contextResult.data as CDSHooksRequest['context'],
    prefetch: base.data.prefetch,
  };

  logger.debug({ hookInstance, hook }, 'Validated CDS Hooks request');
  return { valid: true, request, hookInstance };
}

/**
 * Legacy boolean-shaped wrapper around {@link validateCDSRequest}.
 */
export function validateCDSRequestLegacy(body: unknown): {
  valid: boolean;
  request?: CDSHooksRequest;
  errors?: string[];
} {
  const result = validateCDSRequest(body);
  return result.valid
    ? { valid: true, request: result.request }
    : { valid: false, errors: result.errors };
}

/**
 * Validates the request body as a CDS Hooks request, throwing on failure.
 *
 * @param body - Parsed JSON body from POST.
 * @throws Error with joined validation messages when invalid.
 */
export function validateCdsHooksRequest(body: unknown): CDSHooksRequest {
  const result = validateCDSRequest(body);
  if (!result.valid) {
    throw new Error(result.errors.join('; '));
  }
  return result.request;
}

/**
 * Validates that context contains patientId (required for our hooks).
 */
export function requirePatientId(context: Record<string, unknown>): void {
  if (!context.patientId || typeof context.patientId !== 'string') {
    throw new Error('context.patientId is required');
  }
}
