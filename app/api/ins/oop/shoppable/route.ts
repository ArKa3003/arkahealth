/**
 * Shoppable imaging sites API — radius search with loss-framed price comparison copy.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  haversineMiles,
  lossFramedComparison,
  patientCostFloor,
  type LatLng,
} from "@/lib/ins/shoppable-helpers";
import { latLngFromZip } from "@/lib/ins/us-zip-centroids";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";

export const maxDuration = 8;

const querySchema = z.object({
  cptCode: z.string().min(1, "cptCode is required"),
  zip: z.string().regex(/^\d{5}$/, "zip must be a 5-digit U.S. ZIP"),
  radius: z.coerce.number().positive().max(250),
  payerId: z.string().min(1, "payerId is required"),
});

interface SiteRow {
  id: string;
  name: string;
  address: string | null;
  site_type: string;
  cpt_code: string | null;
  cash_price: number | null;
  negotiated_rate: number | null;
  in_network_payers: string[];
  quality_score: number | null;
  avg_wait_days: number | null;
  lat: number | null;
  lng: number | null;
}

function payerMatchesRow(payerId: string, row: SiteRow): boolean {
  return row.in_network_payers.some((p) => p.toLowerCase() === payerId.toLowerCase());
}

/**
 * GET — top 10 shoppable sites near a ZIP, sorted by lowest patient price floor.
 */
async function getShoppableSites(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    cptCode: url.searchParams.get("cptCode") ?? "",
    zip: url.searchParams.get("zip") ?? "",
    radius: url.searchParams.get("radius") ?? "",
    payerId: url.searchParams.get("payerId") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().formErrors.join("; ") }, { status: 400 });
  }

  const { cptCode, zip, radius, payerId } = parsed.data;
  const origin = latLngFromZip(zip);
  if (!origin) {
    return NextResponse.json(
      {
        error:
          "Unsupported ZIP for distance lookup. Use a ZIP in KC, Dallas–Fort Worth, Phoenix, Atlanta, or NYC corridors (see seed data).",
        code: "ZIP_NOT_MAPPED",
      },
      { status: 400 },
    );
  }

  const { data: supabase, error: adminError } = createAdminClient();
  if (adminError || !supabase) {
    return NextResponse.json(
      { error: adminError?.message ?? "Database unavailable.", code: "SUPABASE_UNAVAILABLE" },
      { status: 503 },
    );
  }

  const { data: rows, error } = await supabase
    .from("ins_shoppable_sites")
    .select(
      "id, name, address, site_type, cpt_code, cash_price, negotiated_rate, in_network_payers, quality_score, avg_wait_days, lat, lng",
    )
    .eq("cpt_code", cptCode);

  if (error) {
    return NextResponse.json({ error: error.message, code: "SHOPPABLE_READ_FAILED" }, { status: 503 });
  }

  const list = (rows ?? []) as SiteRow[];

  const withDistance: Array<SiteRow & { distance: number; floor: number }> = [];
  for (const row of list) {
    if (row.lat == null || row.lng == null) {
      continue;
    }
    const pos: LatLng = { lat: row.lat, lng: row.lng };
    const distance = haversineMiles(origin, pos);
    if (distance > radius) {
      continue;
    }
    const floor = patientCostFloor(row.negotiated_rate, row.cash_price);
    if (!Number.isFinite(floor)) {
      continue;
    }
    withDistance.push({ ...row, distance, floor });
  }

  withDistance.sort((a, b) => a.floor - b.floor);
  const top = withDistance.slice(0, 10);

  if (top.length === 0) {
    return NextResponse.json({
      results: [],
      cashPayWinner: false,
    });
  }

  const maxFloor = Math.max(...top.map((r) => r.floor));
  const minFloor = Math.min(...top.map((r) => r.floor));
  const hi = top.find((r) => r.floor === maxFloor) ?? top[top.length - 1];
  const lo = top.find((r) => r.floor === minFloor) ?? top[0];

  const minCash = Math.min(
    ...top.map((r) => (r.cash_price != null && r.cash_price > 0 ? r.cash_price : Number.POSITIVE_INFINITY)),
  );
  const inNetworkNegRates = top
    .filter((r) => payerMatchesRow(payerId, r))
    .map((r) => r.negotiated_rate)
    .filter((v): v is number => v != null && v > 0);
  const fallbackNeg = top
    .map((r) => r.negotiated_rate)
    .filter((v): v is number => v != null && v > 0);

  const minInsurance =
    inNetworkNegRates.length > 0 ? Math.min(...inNetworkNegRates)
    : fallbackNeg.length > 0 ? Math.min(...fallbackNeg)
    : Number.POSITIVE_INFINITY;

  const cashPayWinner =
    Number.isFinite(minCash) &&
    Number.isFinite(minInsurance) &&
    minCash < minInsurance;

  const globalFraming =
    top.length >= 2 && maxFloor > minFloor + 0.01 ?
      lossFramedComparison(hi.name, lo.name, maxFloor - minFloor)
    : top.length === 1 ?
      "Only one facility matched the search within this radius."
    : "Listed facilities show similar price floors for this CPT in the selected radius.";

  const results = top.map((r) => {
    const negotiatedRate = r.negotiated_rate;
    const cashPrice = r.cash_price;
    const savingsVsMostExpensive = Math.max(0, maxFloor - r.floor);
    const framingText =
      top.length < 2 || maxFloor <= minFloor + 0.01 ? globalFraming
      : r.id === lo.id ?
        lossFramedComparison(hi.name, lo.name, maxFloor - minFloor)
      : lossFramedComparison(r.name, lo.name, r.floor - lo.floor);

    return {
      siteId: r.id,
      name: r.name,
      address: r.address,
      negotiatedRate,
      cashPrice,
      qualityScore: r.quality_score,
      avgWaitDays: r.avg_wait_days,
      distance: Math.round(r.distance * 10) / 10,
      savingsVsMostExpensive: Math.round(savingsVsMostExpensive * 100) / 100,
      siteType: r.site_type,
      cashPayWinner,
      framingText,
    };
  });

  return NextResponse.json({
    results,
    cashPayWinner,
  });
}

export const GET = withInsApiLogging(getShoppableSites);
