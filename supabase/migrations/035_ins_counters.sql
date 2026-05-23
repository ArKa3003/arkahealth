-- Prometheus-style counter events for ARKA observability (no PHI in labels).

create table if not exists public.ins_counters (
  id uuid primary key default gen_random_uuid(),
  counter_name text not null,
  labels jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);

comment on table public.ins_counters is
  'Append-only counter events for INS observability sparklines; labels must be non-PHI key/value pairs only.';

create index if not exists ins_counters_name_time_idx
  on public.ins_counters (counter_name, recorded_at desc);

create index if not exists ins_counters_recorded_at_idx
  on public.ins_counters (recorded_at desc);

alter table public.ins_counters enable row level security;

create policy "service role full access ins_counters"
  on public.ins_counters for all
  using (auth.role() = 'service_role');

grant all on table public.ins_counters to service_role;
