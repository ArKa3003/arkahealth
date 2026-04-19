import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AIIECoverage,
  AIIECoverageFinancials,
  AIIELibError,
  OOPEstimate,
} from "@/lib/types/aiie";

interface OopCacheRow {
  negotiated_rate: number | null;
  cash_price: number | null;
  patient_deductible_remaining: number | null;
  estimated_patient_responsibility: number | null;
  cached_at: string;
  expires_at: string;
  site_id: string | null;
  plan_id: string | null;
}

interface ShoppableSiteRow {
  id: string;
  name: string;
  address: string | null;
  cpt_code: string | null;
  cash_price: number | null;
  in_network_payers: string[];
}

export interface OOPEstimateParams {
  /** Procedure code for pricing and cache keys. */
  cptCode: string;
  /** Coverage metadata plus plan financial fields required for cost-sharing math. */
  coverage: AIIECoverage & AIIECoverageFinancials;
  /** Optional site identifier to reuse cached site-specific estimates. */
  siteId?: string;
  /** Optional plan identifier for cache disambiguation. */
  planId?: string;
}

function computeResponsibilityFromAllowed(
  allowed: number,
  financials: AIIECoverageFinancials,
): { patient: number; deductibleApplied: number } {
  const dedRem = Math.max(0, financials.deductibleRemaining);
  const deductibleApplied = Math.min(dedRem, allowed);
  const afterDeductible = Math.max(0, allowed - deductibleApplied);
  const coinsurancePortion = afterDeductible * Math.min(1, Math.max(0, financials.coinsurance));
  const raw = financials.copay + deductibleApplied + coinsurancePortion;
  const patient = Math.min(allowed, Math.max(0, raw));
  return { patient, deductibleApplied };
}

/**
 * Estimates patient responsibility with shoppable cash comparators and NSA-oriented checks.
 *
 * @param params - Procedure, financial coverage, and optional site or plan identifiers.
 * @returns An `OOPEstimate` or a structured error when Supabase access fails critically.
 */
export async function estimatePatientResponsibility(
  params: OOPEstimateParams,
): Promise<{ data: OOPEstimate | null; error: AIIELibError | null }> {
  const { cptCode, coverage, siteId, planId } = params;
  if (!cptCode.trim()) {
    return {
      data: null,
      error: { code: "INVALID_CPT", message: "cptCode is required." },
    };
  }

  const payerId = coverage.payerId ?? coverage.coverageId;
  if (!payerId?.trim()) {
    return {
      data: null,
      error: {
        code: "MISSING_PAYER_ID",
        message: "coverage.payerId or coverage.coverageId is required for OOP estimation.",
      },
    };
  }

  const { data: supabase, error: adminError } = createAdminClient();
  if (adminError || !supabase) {
    return { data: null, error: adminError };
  }

  const nowIso = new Date().toISOString();
  let cacheQuery = supabase
    .from("ins_oop_estimates")
    .select(
      "negotiated_rate, cash_price, patient_deductible_remaining, estimated_patient_responsibility, cached_at, expires_at, site_id, plan_id",
    )
    .eq("cpt_code", cptCode)
    .eq("payer_id", payerId)
    .gt("expires_at", nowIso);

  if (planId !== undefined) {
    cacheQuery = planId === "" ?
        cacheQuery.is("plan_id", null)
      : cacheQuery.eq("plan_id", planId);
  }

  if (siteId) {
    cacheQuery = cacheQuery.eq("site_id", siteId);
  } else {
    cacheQuery = cacheQuery.is("site_id", null);
  }

  const { data: cacheRows, error: cacheError } = await cacheQuery
    .order("cached_at", { ascending: false })
    .limit(1);

  if (cacheError) {
    return {
      data: null,
      error: { code: "OOP_CACHE_READ_FAILED", message: cacheError.message },
    };
  }

  const financials: AIIECoverageFinancials = { ...coverage };
  const assumptions: string[] = [
    "Estimate assumes in-network benefit design unless otherwise documented.",
    "Coinsurance applies after deductible is applied to the allowed amount for this service.",
  ];

  const cacheList = (cacheRows ?? []) as OopCacheRow[];
  if (cacheList.length > 0) {
    const row = cacheList[0];
    const est = row.estimated_patient_responsibility ?? 0;
    const shoppable = await loadShoppableContext(
      supabase,
      cptCode,
      payerId,
      financials,
      est,
      assumptions,
    );
    if (shoppable.error) {
      return { data: null, error: shoppable.error };
    }
    return {
      data: finalizeEstimate(
        {
          estimatedPatientResponsibility: est,
          deductibleRemaining: row.patient_deductible_remaining ?? financials.deductibleRemaining,
          coinsurance: coverage.coinsurance,
          copay: coverage.copay,
          inNetworkNegotiatedRate: row.negotiated_rate ?? financials.inNetworkNegotiatedRate,
          confidence: 0.82,
          assumptions,
        },
        shoppable.data,
        coverage,
        planId,
        siteId,
      ),
      error: null,
    };
  }

  const allowed = Math.max(0, financials.inNetworkNegotiatedRate);
  const { patient } = computeResponsibilityFromAllowed(allowed, financials);

  const shoppable = await loadShoppableContext(
    supabase,
    cptCode,
    payerId,
    financials,
    patient,
    assumptions,
  );
  if (shoppable.error) {
    return { data: null, error: shoppable.error };
  }

  const estimateCore = {
    estimatedPatientResponsibility: patient,
    deductibleRemaining: financials.deductibleRemaining,
    coinsurance: financials.coinsurance,
    copay: financials.copay,
    inNetworkNegotiatedRate: allowed,
    confidence: 0.74,
    assumptions,
  };

  const { error: writeError } = await supabase.from("ins_oop_estimates").insert({
    cpt_code: cptCode,
    payer_id: payerId,
    plan_id: planId ?? null,
    site_id: siteId ?? null,
    negotiated_rate: allowed,
    cash_price: shoppable.data.cashPayComparator ?? null,
    patient_deductible_remaining: financials.deductibleRemaining,
    estimated_patient_responsibility: patient,
    expires_at: addHoursIso(24),
  });

  if (writeError) {
    assumptions.push(
      "Could not persist this estimate to the ARKA cache (service role insert may be unavailable).",
    );
  }

  return {
    data: finalizeEstimate(
      estimateCore,
      shoppable.data,
      coverage,
      planId,
      siteId,
    ),
    error: null,
  };
}

function addHoursIso(hours: number): string {
  const d = new Date();
  d.setTime(d.getTime() + hours * 60 * 60 * 1000);
  return d.toISOString();
}

async function loadShoppableContext(
  supabase: NonNullable<ReturnType<typeof createAdminClient>["data"]>,
  cptCode: string,
  payerId: string,
  financials: AIIECoverageFinancials,
  baselinePatient: number,
  assumptions: string[],
): Promise<{
  data: {
    cashPayComparator?: number;
    cheapestInNetworkSite?: OOPEstimate["cheapestInNetworkSite"];
    altPatient?: number;
  };
  error: AIIELibError | null;
}> {
  const { data: sites, error } = await supabase
    .from("ins_shoppable_sites")
    .select("id, name, address, cpt_code, cash_price, in_network_payers")
    .eq("cpt_code", cptCode);

  if (error) {
    return {
      data: {},
      error: { code: "SHOPPABLE_READ_FAILED", message: error.message },
    };
  }

  const rows = (sites ?? []) as ShoppableSiteRow[];
  const cashPrices = rows
    .map((s) => s.cash_price)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const cashPayComparator =
    cashPrices.length > 0 ? Math.min(...cashPrices) : undefined;

  if (cashPayComparator !== undefined) {
    assumptions.push(
      "Cash-pay comparator reflects the lowest listed cash price among ARKA shoppable sites for this CPT.",
    );
  } else {
    assumptions.push(
      "No cash-pay comparator was available for this CPT in `ins_shoppable_sites`.",
    );
  }

  const inNetworkRows = rows.filter((s) =>
    s.in_network_payers.map((p) => p.toLowerCase()).includes(payerId.toLowerCase()),
  );
  let cheapestInNetworkSite: OOPEstimate["cheapestInNetworkSite"];
  let altPatient: number | undefined;

  if (inNetworkRows.length > 0) {
    const best = inNetworkRows.reduce((acc, cur) => {
      const price = cur.cash_price ?? Number.POSITIVE_INFINITY;
      const bestPrice = acc.cash_price ?? Number.POSITIVE_INFINITY;
      return price < bestPrice ? cur : acc;
    });
    if (best.cash_price !== null && best.cash_price > 0) {
      const alt = computeResponsibilityFromAllowed(best.cash_price, financials);
      altPatient = alt.patient;
      cheapestInNetworkSite = {
        id: best.id,
        name: best.name,
        estimatedPrice: best.cash_price,
        location: best.address ?? undefined,
      };
    }
  }

  const savingsRate =
    baselinePatient > 0 && altPatient !== undefined ?
      (baselinePatient - altPatient) / baselinePatient
    : 0;

  const alternativeSiteRecommended =
    baselinePatient > 500 && altPatient !== undefined && savingsRate > 0.2;

  if (alternativeSiteRecommended) {
    assumptions.push(
      "Alternative site flag triggered because estimated responsibility exceeds $500 with >20% modeled savings at a listed in-network shoppable site.",
    );
  }

  return {
    data: { cashPayComparator, cheapestInNetworkSite, altPatient },
    error: null,
  };
}

function finalizeEstimate(
  core: {
    estimatedPatientResponsibility: number;
    deductibleRemaining: number;
    coinsurance: number;
    copay: number;
    inNetworkNegotiatedRate: number;
    confidence: number;
    assumptions: string[];
  },
  shoppable: {
    cashPayComparator?: number;
    cheapestInNetworkSite?: OOPEstimate["cheapestInNetworkSite"];
    altPatient?: number;
  },
  coverage: AIIECoverage,
  planId: string | undefined,
  siteId: string | undefined,
): OOPEstimate {
  const baselinePatient = core.estimatedPatientResponsibility;
  const altPatient = shoppable.altPatient;
  const savingsRate =
    baselinePatient > 0 && altPatient !== undefined ?
      (baselinePatient - altPatient) / baselinePatient
    : 0;
  const alternativeSiteRecommended =
    baselinePatient > 500 && altPatient !== undefined && savingsRate > 0.2;

  const goodFaithEstimateCompliant = isNsaComplete({
    cptCode: true,
    negotiatedRate: core.inNetworkNegotiatedRate > 0,
    deductible: core.deductibleRemaining >= 0,
    coinsurance: core.coinsurance >= 0 && core.coinsurance <= 1,
    copay: core.copay >= 0,
    payer: Boolean(coverage.payerId ?? coverage.coverageId),
    plan: Boolean(planId ?? coverage.planName),
    site: Boolean(siteId ?? shoppable.cheapestInNetworkSite?.id),
    facilityNetworkStatus:
      siteId !== undefined ||
      Boolean(shoppable.cheapestInNetworkSite?.id) ||
      Boolean(coverage.productType),
  });

  return {
    estimatedPatientResponsibility: core.estimatedPatientResponsibility,
    deductibleRemaining: core.deductibleRemaining,
    coinsurance: core.coinsurance,
    copay: core.copay,
    inNetworkNegotiatedRate: core.inNetworkNegotiatedRate,
    cashPayComparator: shoppable.cashPayComparator,
    cheapestInNetworkSite: shoppable.cheapestInNetworkSite,
    confidence: core.confidence,
    assumptions: core.assumptions,
    alternativeSiteRecommended,
    goodFaithEstimateCompliant,
  };
}

function isNsaComplete(fields: {
  cptCode: boolean;
  negotiatedRate: boolean;
  deductible: boolean;
  coinsurance: boolean;
  copay: boolean;
  payer: boolean;
  plan: boolean;
  site: boolean;
  facilityNetworkStatus: boolean;
}): boolean {
  return Object.values(fields).every(Boolean);
}
