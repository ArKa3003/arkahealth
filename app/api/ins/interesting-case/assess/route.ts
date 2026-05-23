import { NextResponse } from "next/server";

import {
  buildCptCombo,
  buildIcd10Combo,
  buildRedFlagCombo,
  computeRarityScore,
  type RarityDemographics,
} from "@/lib/aiie/interesting-case";
import type { AIIEOrder, AIIERedFlags, AIIESex } from "@/lib/types/aiie";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";

type AssessBody = {
  snapshot: PatientRecordSnapshot;
  order: AIIEOrder;
  demographics?: RarityDemographics;
  redFlags?: AIIERedFlags;
};

function isSex(value: unknown): value is AIIESex {
  return value === "male" || value === "female";
}

/**
 * POST /api/ins/interesting-case/assess — rarity score from de-identified snapshot + order (no PHI in response).
 */
async function postInterestingCaseAssess(request: Request): Promise<NextResponse> {
  let body: AssessBody;
  try {
    body = (await request.json()) as AssessBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.snapshot?.patientHash || !body.order?.procedure) {
    return NextResponse.json({ error: "snapshot and order are required" }, { status: 400 });
  }

  const demographics =
    body.demographics &&
    Number.isFinite(body.demographics.ageYears) &&
    isSex(body.demographics.sex) ?
      body.demographics
    : undefined;

  const rarity = await computeRarityScore(body.snapshot, body.order, demographics, body.redFlags);

  const totalOrdersHint = 42_110;
  const icd10_combo = buildIcd10Combo(body.snapshot);
  const cpt_combo = buildCptCombo(body.snapshot, body.order);
  const redflag_combo = buildRedFlagCombo(body.redFlags);

  return NextResponse.json({
    rarity,
    totalOrders: totalOrdersHint,
    keys: { icd10_combo, cpt_combo, redflag_combo },
  });
}

export const POST = withInsApiLogging(postInterestingCaseAssess);
