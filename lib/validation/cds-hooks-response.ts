import { z } from "zod";

/**
 * Zod schemas for CDS Hooks 2.0–shaped JSON returned by ARKA-INS CDS services.
 * Used by automated sandbox tests and manual validation against the spec.
 */

export const cdsCardSourceSchema = z.object({
  label: z.string(),
  url: z.string().optional(),
  icon: z.string().optional(),
});

export const cdsActionSchema = z.object({
  type: z.enum(["create", "update", "delete"]),
  description: z.string().optional(),
  resource: z.unknown().optional(),
  resourceId: z.string().optional(),
});

export const cdsOverrideReasonSchema = z.object({
  code: z.string(),
  display: z.string(),
  system: z.string().optional(),
});

export const cdsLinkSchema = z.object({
  label: z.string(),
  url: z.string(),
  type: z.enum(["absolute", "smart"]),
  appContext: z.string().optional(),
});

export const cdsSuggestionSchema = z.object({
  label: z.string(),
  uuid: z.string(),
  isRecommended: z.boolean().optional(),
  actions: z.array(cdsActionSchema),
});

export const cdsCardSchema = z.object({
  uuid: z.string().optional(),
  summary: z.string(),
  detail: z.string().optional(),
  indicator: z.enum(["info", "warning", "critical"]),
  source: cdsCardSourceSchema,
  suggestions: z.array(cdsSuggestionSchema).optional(),
  selectionBehavior: z.enum(["at-most-one", "any"]).optional(),
  overrideReasons: z.array(cdsOverrideReasonSchema).optional(),
  links: z.array(cdsLinkSchema).optional(),
});

/** CDS Hooks service response body (`cards` required; `systemActions` optional). */
export const cdsHookResponseSchema = z.object({
  cards: z.array(cdsCardSchema),
  systemActions: z.array(cdsActionSchema).optional(),
});

export type ParsedCDSHookResponse = z.infer<typeof cdsHookResponseSchema>;
