/**
 * @file route.ts
 * @description Embedded-rail audit endpoint.
 *
 * `POST /api/ehr/events` — records rail automation events (rail render, card
 * view, accept, override, narrative generated, write-back posted) into the
 * platform decision log. Patient ids must arrive pre-hashed (SHA-256 hex); raw
 * identifiers are rejected. Invalid payloads return HTTP 200 with diagnostics
 * so telemetry can never error into an EHR workflow.
 *
 * `GET /api/ehr/events` — returns aggregated automation stats for the INS
 * dashboard (narratives generated, accepts, write-backs, clicks-saved estimate).
 */

import { NextResponse } from "next/server";
import pino from "pino";
import { z } from "zod";

import { MATRIX_VERSION } from "@/lib/aiie/knowledge-matrix";
import {
  readAutomationStats,
  writeRailEventLog,
} from "@/lib/cds-platform/audit/decision-log";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

const logger = pino({
  name: "ehr-rail-events",
  level: process.env.LOG_LEVEL ?? "info",
});

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const SHA256_HEX = /^[a-f0-9]{64}$/;

const railEventSchema = z.looseObject({
  eventType: z.enum([
    "rail_render",
    "card_view",
    "card_accept",
    "card_override",
    "narrative_generated",
    "writeback_posted",
  ]),
  patientHash: z
    .string()
    .regex(SHA256_HEX, "patientHash must be a SHA-256 hex digest — never a raw id"),
  orderId: z.string().max(128).optional(),
  evidenceSlug: z.string().max(128).optional(),
  matrixVersion: z.string().max(32).optional(),
  demoMode: z.boolean().optional(),
  occurredAtISO: z.string().min(1),
});

const railEventsRequestSchema = z.looseObject({
  events: z.array(railEventSchema).min(1).max(50),
});

/**
 * POST /api/ehr/events — append rail automation events to the decision log.
 */
export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { recorded: 0, diagnostics: ["Body must be valid JSON"] },
      { headers: NO_STORE_HEADERS },
    );
  }

  const parsed = railEventsRequestSchema.safeParse(body);
  if (!parsed.success) {
    const diagnostics = parsed.error.issues.map((i) =>
      i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message,
    );
    logger.warn({ diagnostics }, "Rejected invalid rail event payload");
    return NextResponse.json({ recorded: 0, diagnostics }, { headers: NO_STORE_HEADERS });
  }

  const receivedAtISO = new Date().toISOString();
  for (const event of parsed.data.events) {
    // Fire-and-forget: audit persistence never blocks the rail.
    void writeRailEventLog({
      eventType: event.eventType,
      patientHash: event.patientHash,
      orderId: event.orderId,
      evidenceSlug: event.evidenceSlug,
      matrixVersion: event.matrixVersion ?? MATRIX_VERSION,
      demoMode: event.demoMode ?? false,
      occurredAtISO: event.occurredAtISO,
      receivedAtISO,
    }).catch((err) => {
      logger.warn({ err }, "Rail event log write failed");
    });
  }

  return NextResponse.json(
    { recorded: parsed.data.events.length },
    { headers: NO_STORE_HEADERS },
  );
}

/**
 * GET /api/ehr/events — aggregated automation stats for the INS dashboard.
 */
export async function GET(): Promise<NextResponse> {
  const stats = await readAutomationStats();
  return NextResponse.json({ data: stats, error: null }, { headers: NO_STORE_HEADERS });
}
