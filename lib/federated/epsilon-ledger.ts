import { MAX_EPSILON_PER_CPT_PER_WEEK } from "@/lib/federated/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AIIELibError } from "@/lib/types/aiie";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Returns epsilon already spent for a CPT in the rolling 7-day window.
 *
 * @param cpt - CPT code for budget accounting (required for budgeted queries).
 */
export async function epsilonSpentForCpt(cpt: string): Promise<{
  data: number | null;
  error: AIIELibError | null;
}> {
  const { data: supabase, error } = createAdminClient();
  if (error || !supabase) {
    return { data: null, error: error ?? { code: "NO_DB", message: "No admin client." } };
  }
  const since = new Date(Date.now() - WEEK_MS).toISOString();
  const { data: rows, error: qErr } = await supabase
    .schema("arka_lake")
    .from("federated_query_log")
    .select("epsilon")
    .eq("cpt", cpt)
    .gte("created_at", since);
  if (qErr) {
    return { data: null, error: { code: "LEDGER_READ_FAILED", message: qErr.message } };
  }
  const spent = (rows ?? []).reduce((acc, r) => acc + Number(r.epsilon ?? 0), 0);
  return { data: spent, error: null };
}

/**
 * In-memory epsilon ledger for tests and offline simulation.
 */
export type EpsilonLedgerStore = {
  entries: { cpt: string; epsilon: number; at: number }[];
};

/**
 * Checks whether a query would exceed the per-CPT weekly epsilon budget.
 *
 * @param cpt - CPT code (from query filter).
 * @param epsilon - Requested ε for this query.
 * @param store - Optional in-memory ledger (tests); uses Supabase when omitted.
 */
export async function checkEpsilonBudget(
  cpt: string,
  epsilon: number,
  store?: EpsilonLedgerStore,
): Promise<{ data: { allowed: boolean; spent: number } | null; error: AIIELibError | null }> {
  if (epsilon <= 0) {
    return {
      data: null,
      error: { code: "INVALID_EPSILON", message: "epsilon must be positive." },
    };
  }
  let spent = 0;
  if (store) {
    const cutoff = Date.now() - WEEK_MS;
    spent = store.entries
      .filter((e) => e.cpt === cpt && e.at >= cutoff)
      .reduce((acc, e) => acc + e.epsilon, 0);
  } else {
    const { data, error } = await epsilonSpentForCpt(cpt);
    if (error) {
      return { data: null, error };
    }
    spent = data ?? 0;
  }
  const allowed = spent + epsilon <= MAX_EPSILON_PER_CPT_PER_WEEK;
  return { data: { allowed, spent }, error: null };
}

/**
 * Appends a query to the federated audit log and optional in-memory store.
 *
 * @param entry - Log fields for the completed query.
 * @param store - Optional in-memory ledger for tests.
 */
export async function recordFederatedQuery(
  entry: {
    queryId: string;
    kind: string;
    column: string;
    cpt: string | null;
    epsilon: number;
    institutions: number;
    resultValue: number;
    noiseStdDev: number;
  },
  store?: EpsilonLedgerStore,
): Promise<{ data: boolean | null; error: AIIELibError | null }> {
  if (store) {
    if (entry.cpt) {
      store.entries.push({
        cpt: entry.cpt,
        epsilon: entry.epsilon,
        at: Date.now(),
      });
    }
    return { data: true, error: null };
  }
  const { data: supabase, error } = createAdminClient();
  if (error || !supabase) {
    return { data: null, error: error ?? { code: "NO_DB", message: "No admin client." } };
  }
  const { error: insErr } = await supabase.schema("arka_lake").from("federated_query_log").insert({
    query_id: entry.queryId,
    kind: entry.kind,
    column_name: entry.column,
    cpt: entry.cpt,
    epsilon: entry.epsilon,
    institutions: entry.institutions,
    result_value: entry.resultValue,
    noise_std_dev: entry.noiseStdDev,
  });
  if (insErr) {
    return { data: null, error: { code: "LEDGER_WRITE_FAILED", message: insErr.message } };
  }
  return { data: true, error: null };
}
