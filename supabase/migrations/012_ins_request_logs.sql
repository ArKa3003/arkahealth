-- API timing for ARKA-INS and CDS Hooks routes (no PHI). Used for p95 and traffic analysis.

create table if not exists public.ins_request_logs (
  id uuid primary key default gen_random_uuid(),
  request_id text not null,
  path text not null,
  method text not null,
  duration_ms integer not null,
  status_code integer,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists ins_request_logs_path_created_idx
  on public.ins_request_logs (path, created_at desc);

comment on table public.ins_request_logs is 'Per-request API timing; no PHI. ip_hash is SHA-256 of client IP.';

create or replace view public.ins_request_logs_p95_24h as
select
  path,
  count(*)::bigint as request_count,
  (percentile_cont(0.95) within group (order by duration_ms::double precision))::integer as p95_duration_ms
from public.ins_request_logs
where created_at > now() - interval '24 hours'
group by path;
