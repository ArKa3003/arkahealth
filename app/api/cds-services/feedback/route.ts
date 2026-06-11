/**
 * POST /api/cds-services/feedback
 * CDS Hooks 2.0 §Feedback: captures card acceptance and override outcomes from the EHR.
 * Every item is appended to the platform decision log (lib/cds-platform/audit/decision-log.ts)
 * with hookInstance correlation, card uuid, outcome, and override reason coding. No PHI:
 * free-text user comments are never persisted (length only).
 */

import { NextResponse } from "next/server";
import pino from "pino";
import { z } from "zod";

import { writeFeedbackLog } from "@/lib/cds-platform/audit/decision-log";
import { withCdsTiming } from "@/lib/cds-platform/cds-hooks/timing";
import { FDA_DISCLOSURE_VERSION } from "@/lib/compliance/fda-disclosure";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";

export const maxDuration = 10;

const logger = pino({
  name: "cds-hooks-feedback",
  level: process.env.LOG_LEVEL ?? "info",
});

const CDS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Cache-Control": "no-store",
  "X-ARKA-FDA-Compliance": "non-device-cds",
  "X-ARKA-FDA-Disclosure-Version": FDA_DISCLOSURE_VERSION,
};

/** CDS Hooks 2.0 overrideReason: a Coding plus optional free-text comment. */
const overrideReasonSchema = z.looseObject({
  reason: z
    .looseObject({
      code: z.string().optional(),
      system: z.string().optional(),
      display: z.string().optional(),
    })
    .optional(),
  userComment: z.string().optional(),
});

/** One feedback item per CDS Hooks 2.0 §Feedback. */
const feedbackItemSchema = z.looseObject({
  card: z.string().min(1, "feedback[].card (card uuid) is required"),
  outcome: z.enum(["accepted", "overridden"]),
  acceptedSuggestions: z
    .array(z.looseObject({ id: z.string().min(1) }))
    .optional(),
  overrideReason: overrideReasonSchema.optional(),
  outcomeTimestamp: z.string().min(1, "feedback[].outcomeTimestamp is required"),
});

const feedbackRequestSchema = z.looseObject({
  feedback: z.array(feedbackItemSchema).min(1, "feedback array must not be empty"),
  /** ARKA extension: hookInstance correlation id from the originating invocation. */
  hookInstance: z.string().optional(),
  /** ARKA extension: service id the cards came from. */
  serviceId: z.string().optional(),
});

function jsonResponse(body: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: CDS_HEADERS });
}

/**
 * POST /api/cds-services/feedback — record card acceptance/override outcomes.
 * Invalid payloads return HTTP 200 with an OperationOutcome-style extension
 * (feedback must never error into an EHR workflow).
 */
async function handleFeedbackPost(req: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    logger.warn("Feedback request body is not valid JSON");
    return jsonResponse({
      extension: {
        "arka-operation-outcome": {
          resourceType: "OperationOutcome",
          issue: [{ severity: "error", code: "invalid", diagnostics: "Body must be valid JSON" }],
        },
      },
    });
  }

  const parsed = feedbackRequestSchema.safeParse(body);
  if (!parsed.success) {
    const diagnostics = parsed.error.issues.map((i) =>
      i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message,
    );
    logger.warn({ diagnostics }, "Rejected invalid CDS feedback payload");
    return jsonResponse({
      extension: {
        "arka-operation-outcome": {
          resourceType: "OperationOutcome",
          issue: diagnostics.map((d) => ({ severity: "error", code: "invalid", diagnostics: d })),
        },
      },
    });
  }

  const hookInstance = parsed.data.hookInstance ?? "unknown";
  const serviceId = parsed.data.serviceId ?? "unknown";
  const receivedAtISO = new Date().toISOString();

  for (const item of parsed.data.feedback) {
    // Fire-and-forget: feedback persistence never blocks or fails the EHR response.
    void writeFeedbackLog({
      hookInstance,
      serviceId,
      cardUuid: item.card,
      outcome: item.outcome,
      overrideReasonCode: item.overrideReason?.reason?.code,
      overrideReasonSystem: item.overrideReason?.reason?.system,
      overrideCommentLength: item.overrideReason?.userComment?.length,
      acceptedSuggestionIds: item.acceptedSuggestions?.map((s) => s.id),
      outcomeTimestampISO: item.outcomeTimestamp,
      receivedAtISO,
    }).catch((err) => {
      logger.warn({ err, hookInstance }, "Feedback log write failed");
    });
  }

  logger.info(
    { hookInstance, serviceId, items: parsed.data.feedback.length },
    "Recorded CDS feedback",
  );
  return jsonResponse({});
}

export const POST = withInsApiLogging(withCdsTiming("cds-feedback", handleFeedbackPost));

/**
 * CORS preflight for CDS Hooks clients.
 */
async function handleFeedbackOptions(_request: Request): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CDS_HEADERS });
}

export const OPTIONS = withInsApiLogging(handleFeedbackOptions);
