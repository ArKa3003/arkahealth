/**
 * @file rail-telemetry.ts
 * @description Client-side audit helpers for the embedded EHR rail. Every rail
 * render, card view, accept, override, narrative generation, and write-back is
 * posted to `/api/ehr/events`, which appends to the platform decision log.
 *
 * No PHI ever leaves the browser: the patient id is hashed with SHA-256 before
 * posting, and events carry only order ids, evidence slugs, and timestamps.
 * Posting is fire-and-forget — telemetry must never block or break the
 * clinician workflow.
 */

import type { RailEventType } from "@/lib/cds-platform/audit/decision-log";

/** One client-side rail event (patient hash supplied separately). */
export interface RailTelemetryEvent {
  /** Audit event type. */
  eventType: RailEventType;
  /** ServiceRequest id, when order-scoped. */
  orderId?: string;
  /** Evidence slug from the matrix match, when order-scoped. */
  evidenceSlug?: string;
  /** Knowledge matrix semver active for the event. */
  matrixVersion: string;
  /** True when running from sandbox fixtures. */
  demoMode: boolean;
}

/**
 * SHA-256 hex digest of a string via WebCrypto. Used to hash patient ids
 * before any telemetry leaves the browser.
 *
 * @param value - Raw string (e.g. FHIR patient id).
 */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Posts one rail audit event to `/api/ehr/events`. Fire-and-forget: failures
 * are swallowed (telemetry never disturbs the EHR workflow).
 *
 * @param patientHash - SHA-256 hex of the patient id (from {@link sha256Hex}).
 * @param event - Event type and order-scoped metadata.
 */
export function postRailEvent(patientHash: string, event: RailTelemetryEvent): void {
  const body = JSON.stringify({
    events: [{ ...event, patientHash, occurredAtISO: new Date().toISOString() }],
  });
  void fetch("/api/ehr/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Telemetry is best-effort by design.
  });
}
