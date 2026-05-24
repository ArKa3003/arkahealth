/**
 * @file types.ts
 * @description CDS Hooks 2.0 specification types and Zod validation schemas.
 * Matches HL7 CDS Hooks 2.0 specification exactly.
 */

import { z } from 'zod';
import type { FHIRBundle, FHIRServiceRequest } from '../fhir/resources';
import type { Coding } from '../fhir/resources';

// =============================================================================
// Supported hooks (CDS Hooks 2.0)
// =============================================================================

export const CDS_HOOKS = [
  'order-select',
  'order-sign',
  'patient-view',
  'encounter-start',
] as const;

export type CDSHookId = (typeof CDS_HOOKS)[number];

// =============================================================================
// 1. Discovery
// =============================================================================

export interface CDSHooksDiscoveryResponse {
  services: CDSServiceDefinition[];
}

export interface CDSServiceDefinition {
  hook: CDSHookId;
  title: string;
  description: string;
  id: string;
  prefetch?: Record<string, string>;
  usageRequirements?: string;
}

// =============================================================================
// 2. Request
// =============================================================================

export interface CDSHooksRequest {
  hook: string;
  hookInstance: string;
  fhirServer?: string;
  fhirAuthorization?: CDSHooksFhirAuthorization;
  context: CDSHooksContext;
  prefetch?: Record<string, unknown>;
}

export interface CDSHooksFhirAuthorization {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
  subject: string;
}

/** Context for order-select and order-sign hooks */
export interface CDSHooksContext {
  userId: string;
  patientId: string;
  encounterId?: string;
  draftOrders: FHIRBundle<FHIRServiceRequest>;
  selections?: string[];
  [key: string]: unknown;
}

// =============================================================================
// 3. Response
// =============================================================================

export interface CDSHooksResponse {
  cards: CDSCard[];
  systemActions?: CDSSuggestionAction[];
}

export interface CDSCard {
  uuid?: string;
  summary: string;
  detail?: string;
  indicator: 'info' | 'warning' | 'critical';
  source: CDSSource;
  suggestions?: CDSSuggestion[];
  selectionBehavior?: 'at-most-one' | 'any';
  overrideReasons?: CDSOverrideReason[];
  links?: CDSLink[];
}

export interface CDSSuggestion {
  label: string;
  uuid?: string;
  isRecommended?: boolean;
  actions?: CDSSuggestionAction[];
}

export interface CDSSuggestionAction {
  type: 'create' | 'update' | 'delete';
  description: string;
  resource?: unknown;
  resourceId?: string;
}

export interface CDSSource {
  label: string;
  url?: string;
  icon?: string;
  topic?: Coding;
}

export interface CDSOverrideReason {
  code?: string;
  system?: string;
  display: string;
}

export interface CDSLink {
  label: string;
  url: string;
  type: 'absolute' | 'smart';
  appContext?: string;
}

// =============================================================================
// Zod schemas
// =============================================================================

const uuidSchema = z.string().uuid('hookInstance must be a valid UUID');

const supportedHookSchema = z.enum(CDS_HOOKS);

/** Minimal FHIR Bundle schema: resourceType Bundle and valid type */
const fhirBundleSchema = z
  .object({
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
    entry: z.array(z.record(z.unknown())).optional(),
  })
  .passthrough();

const cdSHooksContextSchema = z
  .object({
    userId: z.string().min(1, 'context.userId is required'),
    patientId: z.string().min(1, 'context.patientId is required'),
    encounterId: z.string().optional(),
    draftOrders: fhirBundleSchema,
    selections: z.array(z.string()).optional(),
  })
  .passthrough();

/** Zod schema for CDSHooksRequest (validates supported hooks, UUID, context) */
export const cdSHooksRequestSchema = z.object({
  hook: supportedHookSchema,
  hookInstance: uuidSchema,
  fhirServer: z.string().url().optional(),
  fhirAuthorization: z
    .object({
      access_token: z.string(),
      token_type: z.literal('Bearer'),
      expires_in: z.number(),
      scope: z.string(),
      subject: z.string(),
    })
    .optional(),
  context: cdSHooksContextSchema,
  prefetch: z.record(z.unknown()).optional(),
});

export type CDSHooksRequestValidated = z.infer<typeof cdSHooksRequestSchema>;

/**
 * Validates the request body as a CDS Hooks 2.0 request.
 * Ensures: hook is supported, hookInstance is UUID, context has userId, patientId, and valid draftOrders Bundle.
 */
export function validateCDSHooksRequest(body: unknown): CDSHooksRequestValidated {
  return cdSHooksRequestSchema.parse(body);
}

/**
 * Safe parse: returns { success: true, data } or { success: false, error }.
 */
export function safeValidateCDSHooksRequest(body: unknown): z.SafeParseReturnType<unknown, CDSHooksRequestValidated> {
  return cdSHooksRequestSchema.safeParse(body);
}

// =============================================================================
// Backward-compatibility aliases (legacy names used elsewhere in codebase)
// =============================================================================

export type CdsHooksContext = CDSHooksContext;
export type FhirAuthorization = CDSHooksFhirAuthorization;
export type CdsHooksRequest = CDSHooksRequest;
export type CdsHooksResponse = CDSHooksResponse;
export type CdsCard = CDSCard;
export type CdsCardSource = CDSSource;
export type CdsSuggestion = CDSSuggestion;
export type CdsAction = CDSSuggestionAction;
export type CdsOverrideReason = CDSOverrideReason;
export type CdsLink = CDSLink;
export type CdsService = CDSServiceDefinition;
export type CdsDiscoveryResponse = CDSHooksDiscoveryResponse;
