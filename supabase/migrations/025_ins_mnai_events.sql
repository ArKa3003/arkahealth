-- ARKA-INS: Medical Necessity Alignment Index audit events (no PHI; order keyed by hash).

create table if not exists public.ins_mnai_events (
  id uuid primary key default gen_random_uuid(),
  order_hash text not null,
  icd10 text[] not null,
  cpt text not null,
  index smallint not null,
  tier text not null,
  qualifier_status jsonb not null,
  created_at timestamptz default now()
);

comment on table public.ins_mnai_events is 'MNAI outcomes keyed by hashed order id; ICD-10/CPT only, no patient identifiers.';

create index if not exists ins_mnai_events_order_hash_idx on public.ins_mnai_events (order_hash);
create index if not exists ins_mnai_events_created_at_idx on public.ins_mnai_events (created_at desc);

alter table public.ins_mnai_events enable row level security;

create policy "service role full access ins_mnai_events"
  on public.ins_mnai_events for all
  using (auth.role() = 'service_role');
