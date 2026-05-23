-- Run after migration 033 and optional 100k-row seed (`scripts/benchmark-ins-order-lifecycle.ts`).
-- Expect Index Scan / Hash Left Join; total planning+execution < 200 ms on indexed 100k audit rows.

explain (analyze, buffers, format text)
select distinct on (a.order_hash)
  a.order_hash,
  a.patient_hash,
  a.cpt,
  a.clinical_score,
  a.mnai_tier,
  a.created_at as audit_at,
  s.status::text as scheduling_status,
  s.sla_expires_at,
  case
    when o.estimated_patient_responsibility is not null then 'verified'
    when p.decision in ('approved', 'auto_approved') then 'covered'
    when p.decision = 'denied' then 'not_covered'
    when p.decision = 'pended' then 'pending_review'
    else 'unchecked'
  end as coverage_status,
  p.decision::text as pa_status,
  p.decision_at as pa_decision_at,
  o.estimated_patient_responsibility
from public.ins_aiie_audit a
left join public.ins_scheduling_intent s on s.order_hash = a.order_hash
left join lateral (
  select ph.decision, ph.decision_at
  from public.ins_pa_history ph
  where ph.order_hash = a.order_hash
  order by ph.submitted_at desc nulls last
  limit 1
) p on true
left join lateral (
  select oe.estimated_patient_responsibility
  from public.ins_oop_estimates oe
  where oe.order_hash = a.order_hash
  order by oe.cached_at desc nulls last
  limit 1
) o on true
order by a.order_hash, a.created_at desc
limit 50;
