-- ARKA-INS: de-identified AIIE scoring audit trail (coding / QI; no PHI).

create table if not exists public.ins_aiie_audit (
  id uuid primary key default gen_random_uuid(),
  order_hash text not null,
  patient_hash text not null,
  icd10 text[] not null default '{}',
  cpt text,
  iss smallint,
  gcs smallint,
  mnai_index smallint,
  mnai_tier text,
  clinical_score smallint,
  denial_risk smallint,
  factor_payload jsonb not null,
  created_at timestamptz default now()
);

comment on table public.ins_aiie_audit is 'De-identified AIIE scoring inputs and outcomes keyed by hashed order/patient; used by coding and QI teams.';

create index if not exists ins_aiie_audit_created_at_idx on public.ins_aiie_audit (created_at desc);

alter table public.ins_aiie_audit enable row level security;

create policy "service role full access ins_aiie_audit"
  on public.ins_aiie_audit for all
  using (auth.role() = 'service_role');
