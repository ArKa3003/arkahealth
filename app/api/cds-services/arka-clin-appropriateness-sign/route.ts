/**
 * POST /api/cds-services/arka-clin-appropriateness-sign
 * Hook: order-sign
 * Final guideline-anchored appropriateness check before order is signed.
 * Returns NON-BLOCKING critical-tier cards with descriptive override reasons
 * when the proposed study departs from ACR / specialty guidance.
 * FDA Criterion 3: critical indicator is a styling cue. No structural blocking.
 */

import { NextResponse } from "next/server";

import { redact, writeDecisionLog } from "@/lib/cds-platform/audit/decision-log";
import { handleOrderSign } from "@/lib/cds-platform/cds-hooks/order-sign";
import type { CDSCard, CDSHooksContext, CDSHooksRequest } from "@/lib/cds-platform/cds-hooks/types";
import type { MedicalBasis } from "@/lib/cds-platform/cds-hooks/medical-basis";
import {
  detailIncludesFdaDisclosure,
  FDA_DISCLOSURE_VERSION,
  FDA_NON_DEVICE_CDS_DISCLOSURE,
} from "@/lib/compliance/fda-disclosure";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";
import { safeParseCdsHookRequest, type ParsedCdsHookRequest } from "@/lib/validation/cds-hooks-request";
import { cdsHookResponseSchema } from "@/lib/validation/cds-hooks-response";

export const maxDuration = 10;

const CDS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Cache-Control": "no-store",
  "X-ARKA-FDA-Compliance": "non-device-cds",
  "X-ARKA-FDA-Disclosure-Version": FDA_DISCLOSURE_VERSION,
};

const CLIN_SOURCE_DEFAULT = {
  label: "ARKA-CLIN (AIIE v2.0 + XGBoost)",
  url: "https://arkahealth.com/clin",
} as const;

const ARKA_CLIN_LABEL_PREFIX = "ARKA-CLIN";
const ARKA_CLIN_GUIDELINE_PREFIX = "ARKA-CLIN (Guideline-anchored CDS) — ";

type ClinCard = CDSCard & { medicalBasis?: MedicalBasis };

function jsonResponse(body: { cards: ClinCard[] }, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: CDS_HEADERS });
}

/**
 * Maps the INS/shared CDS Hooks request shape to cds-platform snake_case auth fields.
 */
function toCdsPlatformRequest(parsed: ParsedCdsHookRequest): CDSHooksRequest {
  const auth = parsed.fhirAuthorization;
  return {
    hook: parsed.hook,
    hookInstance: parsed.hookInstance,
    fhirServer: parsed.fhirServer,
    fhirAuthorization: auth
      ? {
          access_token: auth.accessToken,
          token_type: "Bearer",
          expires_in: auth.expiresIn,
          scope: auth.scope ?? "",
          subject: auth.subject ?? "",
        }
      : undefined,
    context: parsed.context as CDSHooksContext,
    prefetch: parsed.prefetch,
  };
}

function ensureClinSourceLabel(label: string): string {
  if (label.startsWith(ARKA_CLIN_LABEL_PREFIX)) {
    return label;
  }
  return `${ARKA_CLIN_GUIDELINE_PREFIX}${label}`;
}

function detailIncludesMedicalBasisLabel(card: ClinCard): boolean {
  const label = card.medicalBasis?.label?.trim();
  if (!label) {
    return false;
  }
  return (card.detail ?? "").includes(label);
}

/**
 * Route-layer enrichment: source attribution, Criterion 2 detail, and FDA footer.
 */
function enrichClinCard(card: ClinCard): ClinCard | null {
  const working: ClinCard = { ...card };

  if (!working.source?.label) {
    working.source = { ...CLIN_SOURCE_DEFAULT };
  } else {
    working.source = {
      ...working.source,
      label: ensureClinSourceLabel(working.source.label),
      url: working.source.url ?? CLIN_SOURCE_DEFAULT.url,
    };
  }

  if (!detailIncludesMedicalBasisLabel(working)) {
    console.warn(
      `[arka-clin-appropriateness-sign] Dropping card ${working.uuid ?? working.summary}: detail missing medicalBasis.label`,
    );
    return null;
  }

  const detail = working.detail ?? "";
  working.detail = detailIncludesFdaDisclosure(detail)
    ? detail
    : `${detail}\n\n${FDA_NON_DEVICE_CDS_DISCLOSURE}`;

  return working;
}

/**
 * POST /api/cds-services/arka-clin-appropriateness-sign — order-sign final imaging review.
 */
async function handleClinAppropriatenessSignPost(req: Request): Promise<NextResponse> {
  const startedAt = Date.now();
  let hookInstance = "unknown";

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ cards: [] }, 400);
  }

  const parsed = safeParseCdsHookRequest(body);
  if (!parsed.ok) {
    return jsonResponse({ cards: [] }, 400);
  }

  hookInstance = parsed.data.hookInstance;

  const platformRequest = toCdsPlatformRequest(parsed.data);
  const raw = await handleOrderSign(platformRequest);

  // FDA Non-Device CDS Criterion 2: empty cards when no guideline-anchored rule fired is intentional — not an error.
  if (raw.cards.length === 0) {
    await writeDecisionLog({
      hookInstance,
      hook: "order-sign",
      hookTimestampISO: new Date().toISOString(),
      scenario: redact({
        patientId:
          typeof platformRequest.context?.patientId === "string"
            ? platformRequest.context.patientId
            : "unknown",
        redFlags: [],
      }),
      rulesFired: [],
      mlInvoked: false,
      cardsShipped: 0,
      fdaDisclosureVersion: FDA_DISCLOSURE_VERSION,
      cardSourceLabels: [],
      durationMs: Date.now() - startedAt,
    });
    return jsonResponse({ cards: [] });
  }

  const enriched: ClinCard[] = [];
  for (const card of raw.cards) {
    const next = enrichClinCard(card as ClinCard);
    if (next) {
      enriched.push(next);
    }
  }

  const withMedicalBasis = enriched.filter((card) => {
    if (!card.medicalBasis) {
      console.error(
        `[arka-clin-appropriateness-sign] ERROR: stripping card ${card.uuid ?? card.summary}: medicalBasis undefined`,
      );
      return false;
    }
    return true;
  });

  const responseBody = { cards: withMedicalBasis };

  const validation = cdsHookResponseSchema.safeParse(responseBody);
  if (!validation.success) {
    console.warn(
      `[arka-clin-appropriateness-sign] Response schema validation failed: ${validation.error.message}`,
    );
    await writeDecisionLog({
      hookInstance,
      hook: "order-sign",
      hookTimestampISO: new Date().toISOString(),
      scenario: redact({
        patientId:
          typeof platformRequest.context?.patientId === "string"
            ? platformRequest.context.patientId
            : "unknown",
        redFlags: [],
      }),
      rulesFired: [],
      mlInvoked: raw.cards.some((c) => (c.detail ?? "").includes("SHAP")),
      cardsShipped: 0,
      fdaDisclosureVersion: FDA_DISCLOSURE_VERSION,
      cardSourceLabels: [],
      durationMs: Date.now() - startedAt,
    });
    return jsonResponse({ cards: [] });
  }

  await writeDecisionLog({
    hookInstance,
    hook: "order-sign",
    hookTimestampISO: new Date().toISOString(),
    scenario: redact({
      patientId:
        typeof platformRequest.context?.patientId === "string"
          ? platformRequest.context.patientId
          : "unknown",
      redFlags: [],
    }),
    rulesFired: withMedicalBasis.map((card) => ({
      ruleId: card.medicalBasis!.citationId,
      medicalBasisCitationId: card.medicalBasis!.citationId,
      tier: card.medicalBasis!.authorityClass,
    })),
    mlInvoked: withMedicalBasis.some((c) => (c.detail ?? "").includes("SHAP")),
    cardsShipped: withMedicalBasis.length,
    fdaDisclosureVersion: FDA_DISCLOSURE_VERSION,
    cardSourceLabels: withMedicalBasis.map((c) => c.source.label),
    durationMs: Date.now() - startedAt,
  });

  return jsonResponse(responseBody);
}

export const POST = withInsApiLogging(handleClinAppropriatenessSignPost);

/**
 * CORS preflight for CDS Hooks clients.
 */
async function handleClinAppropriatenessSignOptions(_request: Request): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CDS_HEADERS });
}

export const OPTIONS = withInsApiLogging(handleClinAppropriatenessSignOptions);
