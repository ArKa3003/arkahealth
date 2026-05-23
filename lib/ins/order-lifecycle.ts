import { createAdminClient } from "@/lib/supabase/admin";
import type { AIIELibError } from "@/lib/types/aiie";

/** Row from `ins_order_lifecycle` (hashed identifiers only). */
export interface OrderLifecycleRow {
  orderHash: string;
  patientHash: string;
  cpt: string | null;
  clinicalScore: number | null;
  mnaiTier: string | null;
  auditAt: string;
  schedulingStatus: string | null;
  slaExpiresAt: string | null;
  coverageStatus: string;
  paStatus: string | null;
  paDecisionAt: string | null;
  estimatedPatientResponsibility: number | null;
}

export interface OrderLifecycleQuery {
  status?: string;
  cpt?: string;
  daysBack?: number;
  page?: number;
  pageSize?: number;
}

export interface OrderLifecyclePage {
  rows: OrderLifecycleRow[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 50;

type DbLifecycleRow = {
  order_hash: string;
  patient_hash: string;
  cpt: string | null;
  clinical_score: number | null;
  mnai_tier: string | null;
  audit_at: string;
  scheduling_status: string | null;
  sla_expires_at: string | null;
  coverage_status: string;
  pa_status: string | null;
  pa_decision_at: string | null;
  estimated_patient_responsibility: number | null;
};

function mapRow(r: DbLifecycleRow): OrderLifecycleRow {
  return {
    orderHash: r.order_hash,
    patientHash: r.patient_hash,
    cpt: r.cpt,
    clinicalScore: r.clinical_score,
    mnaiTier: r.mnai_tier,
    auditAt: r.audit_at,
    schedulingStatus: r.scheduling_status,
    slaExpiresAt: r.sla_expires_at,
    coverageStatus: r.coverage_status,
    paStatus: r.pa_status,
    paDecisionAt: r.pa_decision_at,
    estimatedPatientResponsibility: r.estimated_patient_responsibility,
  };
}

/**
 * Paginated read from `ins_order_lifecycle` with optional status, CPT, and recency filters.
 *
 * @param query - Filter and pagination options.
 */
export async function fetchOrderLifecyclePage(
  query: OrderLifecycleQuery,
): Promise<{ data: OrderLifecyclePage | null; error: AIIELibError | null }> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: supabase, error: adminErr } = createAdminClient();
  if (adminErr || !supabase) {
    return { data: null, error: adminErr };
  }

  let q = supabase.from("ins_order_lifecycle").select("*", { count: "exact" });

  const status = query.status?.trim().toLowerCase();
  if (status) {
    q = q.or(
      `scheduling_status.eq.${status},pa_status.eq.${status},coverage_status.eq.${status}`,
    );
  }

  const cpt = query.cpt?.trim();
  if (cpt) {
    q = q.eq("cpt", cpt);
  }

  const daysBack = query.daysBack;
  if (daysBack != null && daysBack > 0) {
    const since = new Date(Date.now() - daysBack * 86400000).toISOString();
    q = q.gte("audit_at", since);
  }

  const { data, error, count } = await q
    .order("audit_at", { ascending: false })
    .range(from, to);

  if (error) {
    return {
      data: null,
      error: { code: "ORDER_LIFECYCLE_QUERY_FAILED", message: error.message },
    };
  }

  const rows = ((data ?? []) as DbLifecycleRow[]).map(mapRow);
  const total = count ?? rows.length;

  return {
    data: {
      rows,
      page,
      pageSize,
      total,
      hasMore: from + rows.length < total,
    },
    error: null,
  };
}
