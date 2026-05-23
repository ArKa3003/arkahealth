-- ARKA-INS: unified order lifecycle read-model (hashed ids only; no PHI).

alter table public.ins_pa_history
  add column if not exists order_hash text;

alter table public.ins_oop_estimates
  add column if not exists order_hash text;

comment on column public.ins_pa_history.order_hash is 'SHA-256 order key aligned with ins_aiie_audit / scheduling intent; no PHI.';
comment on column public.ins_oop_estimates.order_hash is 'SHA-256 order key for per-order cached OOP; no PHI.';

create index if not exists ins_aiie_audit_order_hash_created_idx
  on public.ins_aiie_audit (order_hash, created_at desc);

create index if not exists ins_pa_history_order_hash_submitted_idx
  on public.ins_pa_history (order_hash, submitted_at desc)
  where order_hash is not null;

create index if not exists ins_oop_estimates_order_hash_cached_idx
  on public.ins_oop_estimates (order_hash, cached_at desc)
  where order_hash is not null;

create or replace view public.ins_order_lifecycle as
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
order by a.order_hash, a.created_at desc;

comment on view public.ins_order_lifecycle is
  'De-identified in-flight imaging orders: AIIE audit, scheduling, coverage, PA, and OOP (hashed keys only).';

grant select on public.ins_order_lifecycle to authenticated;
