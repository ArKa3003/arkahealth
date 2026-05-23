/**
 * Client-side fetch of ARKA-INS CDS coverage for the investor demo (Appeal Risk + RBM steps).
 */

import { buildDemoCdsCoverageRequest } from "@/lib/demos/ins/build-demo-cds-request";
import {
  findArkaInsCoverageCard,
  mapCoverageCardToDemoModels,
  type ParsedCoverageDemo,
} from "@/lib/demos/ins/parse-coverage-cds-response";
import type { Patient, ImagingOrder, RBMVendor } from "@/lib/demos/ins/types";
import { cdsHookResponseSchema } from "@/lib/validation/cds-hooks-response";

/**
 * POSTs a synthetic CDS request to `/api/cds-services/arka-ins-coverage` and maps the coverage card
 * into demo store models.
 *
 * @param patient - Selected demo patient.
 * @param order - Selected demo imaging order.
 */
export async function fetchInsCoverageForDemo(patient: Patient, order: ImagingOrder): Promise<ParsedCoverageDemo> {
  const hookInstance =
    typeof crypto !== "undefined" && "randomUUID" in crypto ?
      crypto.randomUUID()
    : `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const req = buildDemoCdsCoverageRequest(patient, order, hookInstance);
  const res = await fetch("/api/cds-services/arka-ins-coverage", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(req),
  });

  const raw: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Coverage service HTTP ${res.status}`);
  }

  const parsed = cdsHookResponseSchema.safeParse(raw);
  const cards = parsed.success ? parsed.data.cards : (raw as { cards?: unknown })?.cards;
  if (!Array.isArray(cards)) {
    throw new Error("Invalid CDS response shape");
  }

  const card = findArkaInsCoverageCard(cards);
  if (!card?.detail) {
    throw new Error("Coverage card missing from CDS response");
  }

  return mapCoverageCardToDemoModels({
    orderId: order.id,
    detail: card.detail,
    summary: card.summary,
    suggestions: card.suggestions,
    rbmVendor: patient.insurancePlan.rbmVendor as RBMVendor,
  });
}
