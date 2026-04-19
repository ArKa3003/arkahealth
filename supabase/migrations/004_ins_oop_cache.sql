-- ARKA-INS: shoppable care sites and cached out-of-pocket estimates (no PHI).

create type public.ins_site_type as enum(
  'hospital',
  'imaging_center',
  'freestanding',
  'cash_pay'
);

create table if not exists public.ins_shoppable_sites (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  address text,
  site_type public.ins_site_type not null,
  cpt_code text,
  cash_price numeric,
  in_network_payers text[] not null default '{}',
  quality_score numeric,
  avg_wait_days integer,
  lat double precision,
  lng double precision
);

comment on table public.ins_shoppable_sites is 'Facility-level shoppable services; no patient data.';

create table if not exists public.ins_oop_estimates (
  id uuid primary key default gen_random_uuid (),
  cpt_code text not null,
  payer_id text not null,
  plan_id text,
  site_id uuid references public.ins_shoppable_sites (id) on delete set null,
  negotiated_rate numeric,
  cash_price numeric,
  patient_deductible_remaining numeric,
  estimated_patient_responsibility numeric,
  cached_at timestamptz not null default now(),
  expires_at timestamptz not null
);

comment on table public.ins_oop_estimates is 'Cached plan/site OOP estimates; no PHI.';

create index if not exists idx_ins_oop_estimates_cpt_payer on public.ins_oop_estimates (cpt_code, payer_id);
create index if not exists idx_ins_oop_estimates_expires_at on public.ins_oop_estimates (expires_at);

create index if not exists idx_ins_shoppable_sites_cpt on public.ins_shoppable_sites (cpt_code);
create index if not exists idx_ins_shoppable_sites_site_type on public.ins_shoppable_sites (site_type);

alter table public.ins_shoppable_sites enable row level security;
alter table public.ins_oop_estimates enable row level security;

create policy ins_shoppable_sites_select_authenticated on public.ins_shoppable_sites for select to authenticated using (true);

create policy ins_oop_estimates_select_authenticated on public.ins_oop_estimates for select to authenticated using (true);

grant select on table public.ins_shoppable_sites to authenticated;
grant select on table public.ins_oop_estimates to authenticated;
