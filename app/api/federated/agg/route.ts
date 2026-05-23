/**
 * Institution federated aggregation endpoint — accepts masked partial sums only.
 * Gated by institution JWT; never returns row-level lake data.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { handleMaskedAggRequest } from "@/lib/federated/agg-handler";
import { verifyInstitutionFederatedJwt } from "@/lib/federated/institution-jwt";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FederatedLakeRow } from "@/lib/federated/types";

export const maxDuration = 8;

const bodySchema = z.object({
  queryId: z.string().min(1),
  roundId: z.string().min(1),
  kind: z.literal("mean"),
  column: z.string().min(1),
  filter: z
    .object({
      cpt: z.string().optional(),
    })
    .optional(),
  maskedSum: z.number(),
  maskedCount: z.number(),
});

function bearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) {
    return null;
  }
  return h.slice(7).trim();
}

/**
 * Loads institution-local lake rows for aggregation (metadata only, no PHI).
 *
 * @param institutionId - JWT institution_id claim.
 */
async function loadInstitutionRows(
  institutionId: string,
): Promise<{ data: FederatedLakeRow[] | null; error: string | null }> {
  const { data: supabase, error } = createAdminClient();
  if (error || !supabase) {
    return { data: null, error: error?.message ?? "no database" };
  }
  const { data: rows, error: qErr } = await supabase
    .schema("arka_lake")
    .from("imaging_orders")
    .select("cpt, appropriateness, denial_risk, prior_imaging_within_30d")
    .eq("institution_id", institutionId);
  if (qErr) {
    return { data: null, error: qErr.message };
  }
  return { data: (rows ?? []) as FederatedLakeRow[], error: null };
}

async function postFederatedAgg(request: Request): Promise<NextResponse> {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const token = bearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: claims, error: jwtErr } = verifyInstitutionFederatedJwt(token);
  if (jwtErr || !claims) {
    return NextResponse.json({ error: jwtErr?.message ?? "Unauthorized." }, { status: 401 });
  }

  const { data: rows, error: loadErr } = await loadInstitutionRows(claims.institution_id);
  if (loadErr || !rows) {
    return NextResponse.json({ error: loadErr ?? "Failed to load aggregates." }, { status: 503 });
  }

  const { data, error } = handleMaskedAggRequest(
    { institutionId: claims.institution_id, rows },
    parsed.data,
    token,
  );

  if (error) {
    const status =
      error.code === "UNAUTHORIZED" || error.code === "INVALID_JWT" || error.code === "JWT_EXPIRED"
        ? 401
        : error.code === "INSTITUTION_MISMATCH"
          ? 403
          : 400;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }

  return NextResponse.json(data);
}

export const POST = withInsApiLogging(postFederatedAgg);
