-- Federated analytics query audit log (coordinator-side epsilon ledger).

create table if not exists arka_lake.federated_query_log (
  id uuid primary key default gen_random_uuid(),
  query_id text not null,
  kind text not null check (kind in ('mean', 'count', 'rate')),
  column_name text not null,
  cpt text,
  epsilon numeric(8, 4) not null check (epsilon > 0),
  institutions integer not null default 0 check (institutions >= 0),
  result_value numeric(12, 4),
  noise_std_dev numeric(12, 6),
  created_at timestamptz not null default now()
);

comment on table arka_lake.federated_query_log is
  'Audit trail for cross-institution aggregate queries; drives per-CPT epsilon budget enforcement.';

create index if not exists federated_query_log_cpt_created_idx
  on arka_lake.federated_query_log (cpt, created_at desc)
  where cpt is not null;

create index if not exists federated_query_log_query_id_idx
  on arka_lake.federated_query_log (query_id);

alter table arka_lake.federated_query_log enable row level security;

create policy "service role full access federated_query_log"
  on arka_lake.federated_query_log
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant all on table arka_lake.federated_query_log to service_role;
