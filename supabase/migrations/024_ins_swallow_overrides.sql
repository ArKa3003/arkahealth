-- ARKA-INS: VFSS/FEES triage clinician overrides for QI trending (no PHI).

create table if not exists public.ins_swallow_overrides (
  id uuid primary key default gen_random_uuid(),
  patient_hash text not null,
  proposed text not null,
  recommended text not null,
  clinician_choice text not null,
  override_reason text,
  created_at timestamptz default now()
);

comment on table public.ins_swallow_overrides is
  'De-identified swallow-study triage overrides when clinicians order VFSS despite FEES/bedside recommendation.';

alter table public.ins_swallow_overrides
  add constraint ins_swallow_overrides_patient_hash_sha256 check (
    patient_hash ~ '^[a-fA-F0-9]{64}$'
  );

create index if not exists ins_swallow_overrides_created_at_idx
  on public.ins_swallow_overrides (created_at desc);

alter table public.ins_swallow_overrides enable row level security;

create policy "service role full access ins_swallow_overrides"
  on public.ins_swallow_overrides for all
  using (auth.role() = 'service_role');
