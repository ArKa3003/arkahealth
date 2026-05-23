-- ARKA-INS: per-patient FHIR record snapshot cache (hashed patient key only; no PHI in key).

create table if not exists public.ins_record_cache (
  patient_hash text primary key,
  snapshot jsonb not null,
  captured_at timestamptz not null default now(),
  expires_at timestamptz not null
);

comment on table public.ins_record_cache is 'Normalized FHIR record snapshots keyed by SHA-256 patient hash; 30-minute default TTL.';

create index if not exists ins_record_cache_expires_at_idx on public.ins_record_cache (expires_at);

alter table public.ins_record_cache enable row level security;

create policy "service role full access ins_record_cache"
  on public.ins_record_cache for all
  using (auth.role() = 'service_role');
