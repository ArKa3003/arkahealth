-- ARKA-INS: STAT priority gate audit events (no PHI; order keyed by hash).

create table if not exists public.ins_stat_events (
  id uuid primary key default gen_random_uuid(),
  order_hash text not null,
  priority_requested text not null,
  priority_recommended text not null,
  meets_criteria boolean not null,
  matched_criteria text[],
  override_reason text,
  clinician_hash text,
  created_at timestamptz default now()
);

comment on table public.ins_stat_events is 'STAT gate outcomes keyed by hashed order id; no patient identifiers.';

create index if not exists ins_stat_events_order_hash_idx on public.ins_stat_events (order_hash);
create index if not exists ins_stat_events_created_at_idx on public.ins_stat_events (created_at desc);

alter table public.ins_stat_events enable row level security;

create policy "service role full access ins_stat_events"
  on public.ins_stat_events for all
  using (auth.role() = 'service_role');
