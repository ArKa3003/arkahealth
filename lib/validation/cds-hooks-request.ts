import { z } from "zod";

/**
 * Zod schema for CDS Hooks 2.0 service request bodies (POST to hook URLs).
 * @see https://cds-hooks.hl7.org/2.0/#calling-a-service
 */

const cdsFhirAuthorizationSchema = z.object({
  accessToken: z.string(),
  tokenType: z.string(),
  expiresIn: z.number(),
  scope: z.string().optional(),
  subject: z.string().optional(),
  patient: z.string().optional(),
  encounter: z.string().optional(),
});

/** CDS Hooks request payload sent by the EHR to each service endpoint. */
export const cdsHookRequestSchema = z.object({
  hook: z.string().min(1),
  hookInstance: z.string().min(1),
  fhirServer: z.string().optional(),
  fhirAuthorization: cdsFhirAuthorizationSchema.optional(),
  context: z.record(z.string(), z.unknown()),
  prefetch: z.record(z.string(), z.unknown()).optional(),
});

export type ParsedCdsHookRequest = z.infer<typeof cdsHookRequestSchema>;

/**
 * Validates a CDS Hooks 2.0 POST body. Returns a structured error for HTTP 400.
 *
 * @param body - Parsed JSON body from the client.
 */
export function safeParseCdsHookRequest(body: unknown): {
  ok: true;
  data: ParsedCdsHookRequest;
} | {
  ok: false;
  message: string;
} {
  const r = cdsHookRequestSchema.safeParse(body);
  if (r.success) {
    return { ok: true, data: r.data };
  }
  const msg = r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  return { ok: false, message: msg || "Invalid CDS Hooks request" };
}
