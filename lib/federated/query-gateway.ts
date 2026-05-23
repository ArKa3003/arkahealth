import { randomUUID } from "node:crypto";

import { handleMaskedAggRequest } from "@/lib/federated/agg-handler";
import { MIN_FEDERATED_INSTITUTIONS } from "@/lib/federated/constants";
import {
  checkEpsilonBudget,
  recordFederatedQuery,
  type EpsilonLedgerStore,
} from "@/lib/federated/epsilon-ledger";
import { signInstitutionFederatedJwt } from "@/lib/federated/institution-jwt";
import { addLaplaceNoise } from "@/lib/federated/laplace";
import {
  filterLakeRows,
  localCountOrRate,
  localMeanParts,
} from "@/lib/federated/local-aggregate";
import { generateZeroSumMasks } from "@/lib/federated/secret-sharing";
import type {
  FederatedLakeRow,
  FederatedQuery,
  FederatedResult,
  MaskedAggRequest,
} from "@/lib/federated/types";
import type { AIIELibError } from "@/lib/types/aiie";

export type { FederatedQuery, FederatedResult, FederatedFilter } from "@/lib/federated/types";

export type InstitutionFederatedSite = {
  institutionId: string;
  /** Base URL for HTTP agg (e.g. https://site-a.arka.health). */
  baseUrl?: string;
  /** In-memory rows for simulation / tests. */
  rows?: FederatedLakeRow[];
};

export type FederatedGatewayOptions = {
  institutions: InstitutionFederatedSite[];
  /** When set, skips Supabase ledger and uses this store (tests). */
  epsilonLedger?: EpsilonLedgerStore;
  /** Override fetch for HTTP institution proxies (tests). */
  fetchImpl?: typeof fetch;
};

/**
 * Poses an aggregate query across institutions without exposing row-level data.
 * Counts/rates use Laplace noise; means use additive masking via institution agg endpoints.
 *
 * @param q - Federated query specification.
 * @param options - Institution registry and optional test hooks.
 */
export async function askFederatedQuery(
  q: FederatedQuery,
  options?: FederatedGatewayOptions,
): Promise<{ data: FederatedResult | null; error: AIIELibError | null; status?: number }> {
  const validation = validateQuery(q);
  if (validation) {
    return { data: null, error: validation, status: 400 };
  }

  const cpt = q.filter?.cpt?.trim() ?? null;
  if (!cpt) {
    return {
      data: null,
      error: { code: "CPT_REQUIRED", message: "filter.cpt is required for epsilon accounting." },
      status: 400,
    };
  }

  const { data: budget, error: budgetErr } = await checkEpsilonBudget(
    cpt,
    q.epsilon,
    options?.epsilonLedger,
  );
  if (budgetErr) {
    return { data: null, error: budgetErr, status: 500 };
  }
  if (!budget?.allowed) {
    return {
      data: null,
      error: {
        code: "EPSILON_BUDGET_EXCEEDED",
        message: `Epsilon budget exceeded for CPT ${cpt} (spent ${budget?.spent ?? 0}, max 5/week).`,
      },
      status: 429,
    };
  }

  const sites = options?.institutions ?? parseInstitutionsFromEnv();
  if (sites.length < MIN_FEDERATED_INSTITUTIONS) {
    return {
      data: null,
      error: {
        code: "INSUFFICIENT_INSTITUTIONS",
        message: `At least ${MIN_FEDERATED_INSTITUTIONS} institutions must be configured.`,
      },
      status: 503,
    };
  }

  const queryId = randomUUID();
  let result: FederatedResult;

  if (q.kind === "mean") {
    const meanResult = await federatedMean(q, sites, queryId, options?.fetchImpl);
    if (meanResult.error) {
      return { data: null, error: meanResult.error, status: meanResult.status ?? 500 };
    }
    result = meanResult.data!;
  } else {
    result = federatedCountOrRate(q, sites);
  }

  const instCount = sites.length;
  await recordFederatedQuery(
    {
      queryId,
      kind: q.kind,
      column: q.column,
      cpt,
      epsilon: q.epsilon,
      institutions: instCount,
      resultValue: result.value,
      noiseStdDev: result.noiseStdDev,
    },
    options?.epsilonLedger,
  );

  if (q.kind === "count" || q.kind === "rate") {
    result.institutions = instCount;
  }

  return { data: result, error: null };
}

function validateQuery(q: FederatedQuery): AIIELibError | null {
  if (q.epsilon <= 0) {
    return { code: "INVALID_EPSILON", message: "epsilon must be positive." };
  }
  if (!q.column?.trim()) {
    return { code: "INVALID_COLUMN", message: "column is required." };
  }
  if (!["mean", "count", "rate"].includes(q.kind)) {
    return { code: "INVALID_KIND", message: "kind must be mean, count, or rate." };
  }
  return null;
}

function federatedCountOrRate(q: FederatedQuery, sites: InstitutionFederatedSite[]): FederatedResult {
  if (q.kind === "count") {
    let total = 0;
    for (const site of sites) {
      const filtered = filterLakeRows(site.rows ?? [], q.filter);
      total += localCountOrRate(filtered, "count", q.column);
    }
    const { noisyValue, noiseStdDev } = addLaplaceNoise(total, q.epsilon, 1);
    return { value: noisyValue, noiseStdDev };
  }

  let numer = 0;
  let denom = 0;
  for (const site of sites) {
    const filtered = filterLakeRows(site.rows ?? [], q.filter);
    denom += filtered.length;
    numer += filtered.filter((r) => r.prior_imaging_within_30d === true).length;
  }
  const rate = denom === 0 ? 0 : numer / denom;
  const { noisyValue, noiseStdDev } = addLaplaceNoise(rate, q.epsilon, 1);
  return { value: noisyValue, noiseStdDev };
}

async function federatedMean(
  q: FederatedQuery,
  sites: InstitutionFederatedSite[],
  queryId: string,
  fetchImpl?: typeof fetch,
): Promise<{
  data: FederatedResult | null;
  error: AIIELibError | null;
  status?: number;
}> {
  const masks = generateZeroSumMasks(sites.length);
  const roundId = randomUUID();
  let maskedSum = 0;
  let maskedCount = 0;
  for (let i = 0; i < sites.length; i++) {
    const site = sites[i]!;
    const mask = masks[i] ?? 0;
    const req: MaskedAggRequest = {
      queryId,
      roundId,
      kind: "mean",
      column: q.column,
      filter: q.filter,
      maskedSum: mask,
      maskedCount: mask,
    };

    const partial = await requestInstitutionAgg(site, req, fetchImpl);
    if (partial.error) {
      return { data: null, error: partial.error, status: partial.status };
    }
    maskedSum += partial.data!.maskedSum;
    maskedCount += partial.data!.maskedCount;
  }

  if (maskedCount === 0) {
    return {
      data: null,
      error: { code: "EMPTY_COHORT", message: "No rows matched the federated filter." },
      status: 404,
    };
  }

  const value = maskedSum / maskedCount;
  return {
    data: {
      value,
      noiseStdDev: 0,
    },
    error: null,
  };
}

async function requestInstitutionAgg(
  site: InstitutionFederatedSite,
  body: MaskedAggRequest,
  fetchImpl?: typeof fetch,
): Promise<{
  data: { maskedSum: number; maskedCount: number } | null;
  error: AIIELibError | null;
  status?: number;
}> {
  if (site.rows) {
    const { data: token } = signInstitutionFederatedJwt(site.institutionId);
    const { data, error } = handleMaskedAggRequest(
      { institutionId: site.institutionId, rows: site.rows },
      body,
      token,
    );
    if (error) {
      return { data: null, error, status: 401 };
    }
    return { data, error: null };
  }

  if (!site.baseUrl) {
    return {
      data: null,
      error: {
        code: "MISSING_INSTITUTION_URL",
        message: `No baseUrl for institution ${site.institutionId}.`,
      },
      status: 503,
    };
  }

  const { data: token, error: signErr } = signInstitutionFederatedJwt(site.institutionId);
  if (signErr || !token) {
    return { data: null, error: signErr ?? { code: "JWT_SIGN_FAILED", message: "Sign failed." } };
  }

  const url = `${site.baseUrl.replace(/\/$/, "")}/api/federated/agg`;
  const doFetch = fetchImpl ?? fetch;
  let res: Response;
  try {
    res = await doFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    return { data: null, error: { code: "AGG_FETCH_FAILED", message: msg }, status: 502 };
  }

  if (!res.ok) {
    return {
      data: null,
      error: { code: "AGG_HTTP_ERROR", message: `Institution agg returned ${res.status}.` },
      status: res.status,
    };
  }

  const json = (await res.json()) as { maskedSum: number; maskedCount: number };
  return { data: json, error: null };
}

function parseInstitutionsFromEnv(): InstitutionFederatedSite[] {
  const raw = process.env.FEDERATED_INSTITUTION_URLS?.trim();
  if (!raw) {
    return [];
  }
  try {
    const map = JSON.parse(raw) as Record<string, string>;
    return Object.entries(map).map(([institutionId, baseUrl]) => ({
      institutionId,
      baseUrl,
    }));
  } catch {
    return [];
  }
}

/**
 * Ground-truth mean across in-memory institution rows (tests only).
 *
 * @param q - Mean query.
 * @param sites - Institution row stores.
 */
export function federatedMeanGroundTruth(
  q: FederatedQuery,
  sites: InstitutionFederatedSite[],
): number {
  let sum = 0;
  let count = 0;
  for (const site of sites) {
    const filtered = filterLakeRows(site.rows ?? [], q.filter);
    const parts = localMeanParts(filtered, q.column);
    sum += parts.sum;
    count += parts.count;
  }
  return count === 0 ? 0 : sum / count;
}
