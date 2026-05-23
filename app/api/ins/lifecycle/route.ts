import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchOrderLifecyclePage } from "@/lib/ins/order-lifecycle";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";

export const maxDuration = 8;

const querySchema = z.object({
  status: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined)),
  cpt: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined)),
  daysBack: z.coerce.number().int().min(1).max(365).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

/**
 * GET /api/ins/lifecycle — paginated order lifecycle read-model (hashed ids only; no PHI).
 */
async function getOrderLifecycle(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    cpt: searchParams.get("cpt") ?? undefined,
    daysBack: searchParams.get("daysBack") ?? undefined,
    page: searchParams.get("page") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data, error } = await fetchOrderLifecyclePage({
    status: parsed.data.status,
    cpt: parsed.data.cpt,
    daysBack: parsed.data.daysBack,
    page: parsed.data.page,
    pageSize: 50,
  });

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Lifecycle query failed." },
      { status: 503 },
    );
  }

  return NextResponse.json(data, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}

export const GET = withInsApiLogging(getOrderLifecycle);
