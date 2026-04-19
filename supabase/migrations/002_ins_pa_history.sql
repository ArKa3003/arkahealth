-- ARKA-INS: prior authorization history. patient_hash is SHA-256 hex only — never store PHI.

create type public.ins_pa_decision as enum(
  'approved',
  'denied',
  'pended',
  'auto_approved'
);

create table if not exists public.ins_pa_history (
  id uuid primary key default gen_random_uuid (),
  provider_id uuid not null references public.ins_providers (id) on delete restrict,
  patient_hash text not null,
  cpt_code text not null,
  icd10_codes text[] not null default '{}',
  payer_id text not null,
  aiie_clinical_score numeric,
  aiie_denial_risk numeric,
  submitted_at timestamptz not null default now(),
  decision public.ins_pa_decision not null,
  decision_at timestamptz,
  appeal_filed boolean not null default false,
  appeal_overturned boolean not null default false,
  constraint ins_pa_history_patient_hash_sha256 check (
    patient_hash ~ '^[a-fA-F0-9]{64}$'
  )
);

comment on table public.ins_pa_history is 'PA outcomes keyed by SHA-256 patient hash only; no PHI.';

create index if not exists idx_ins_pa_history_provider_id on public.ins_pa_history (provider_id);
create index if not exists idx_ins_pa_history_cpt_code on public.ins_pa_history (cpt_code);
create index if not exists idx_ins_pa_history_payer_id on public.ins_pa_history (payer_id);
create index if not exists idx_ins_pa_history_submitted_at on public.ins_pa_history (submitted_at desc);

alter table public.ins_pa_history enable row level security;

create policy ins_pa_history_select_authenticated on public.ins_pa_history for select to authenticated using (true);

grant select on table public.ins_pa_history to authenticated;
