-- ARKA-INS: provider directory (no PHI). RLS: authenticated read; writes via service_role only (bypasses RLS).

create table if not exists public.ins_providers (
  id uuid primary key default gen_random_uuid (),
  npi text not null,
  name text,
  specialty text,
  organization text,
  state text,
  created_at timestamptz not null default now(),
  constraint ins_providers_npi_key unique (npi)
);

comment on table public.ins_providers is 'ARKA-INS payer/provider index. No patient identifiers.';

create index if not exists idx_ins_providers_state on public.ins_providers (state);

alter table public.ins_providers enable row level security;

create policy ins_providers_select_authenticated on public.ins_providers for select to authenticated using (true);

grant select on table public.ins_providers to authenticated;
