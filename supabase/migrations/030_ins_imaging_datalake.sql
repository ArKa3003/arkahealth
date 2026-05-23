-- ARKA-INS: de-identified imaging metadata lake (metadata + report conclusions; no pixels).
-- Federation-friendly `arka_lake` schema; institution-scoped RLS on row-level tables.

create schema if not exists arka_lake;

comment on schema arka_lake is
  'Governed imaging metadata lake: hashed identifiers, coarse demographics, and redacted report text only.';

create table if not exists arka_lake.imaging_orders (
  id uuid primary key default gen_random_uuid(),
  institution_id text not null,
  order_hash text not null,
  patient_hash text not null,
  age_bucket text not null,
  sex text not null,
  icd10 text[] not null default '{}',
  cpt text,
  modality text,
  body_part text,
  appropriateness smallint,
  denial_risk smallint,
  prior_imaging_within_30d boolean not null default false,
  trauma_severity text,
  mnai_tier text,
  report_conclusion_redacted text,
  created_at timestamptz not null default now(),
  constraint imaging_orders_age_bucket_check check (
    age_bucket in ('0-4', '5-17', '18-44', '45-64', '65-84', '85+')
  ),
  constraint imaging_orders_order_hash_format check (order_hash ~ '^[a-f0-9]{64}$'),
  constraint imaging_orders_patient_hash_format check (patient_hash ~ '^[a-f0-9]{64}$')
);

comment on table arka_lake.imaging_orders is
  'De-identified imaging order metadata and redacted report conclusions; patient_hash is institution-salted.';

create unique index if not exists imaging_orders_institution_order_uidx
  on arka_lake.imaging_orders (institution_id, order_hash);

create index if not exists imaging_orders_institution_created_idx
  on arka_lake.imaging_orders (institution_id, created_at desc);

create index if not exists imaging_orders_cpt_created_idx
  on arka_lake.imaging_orders (cpt, created_at desc);

create index if not exists imaging_orders_institution_cpt_idx
  on arka_lake.imaging_orders (institution_id, cpt);

alter table arka_lake.imaging_orders enable row level security;

create policy "service role full access arka_lake imaging_orders"
  on arka_lake.imaging_orders
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "institution scoped select imaging_orders"
  on arka_lake.imaging_orders
  for select
  to authenticated
  using (
    institution_id = coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'institution_id',
      ''
    )
  );

-- Rolled-up benchmarks (no patient_hash); safe for cross-institution dashboards when aggregated upstream.
create materialized view if not exists arka_lake.institution_benchmarks as
select
  institution_id,
  coalesce(cpt, '_unknown') as cpt,
  count(*)::bigint as order_count,
  round(
    100.0 * avg(case when coalesce(appropriateness, 0) >= 70 then 1.0 else 0.0 end),
    2
  )::numeric(6, 2) as pct_appropriate,
  round(
    100.0 * avg(case when mnai_tier = 'green' then 1.0 else 0.0 end),
    2
  )::numeric(6, 2) as pct_green_mnai,
  round(
    100.0 * avg(case when prior_imaging_within_30d then 1.0 else 0.0 end),
    2
  )::numeric(6, 2) as pct_duplicate_orders,
  round(avg(coalesce(appropriateness, 0)::numeric), 2)::numeric(6, 2) as avg_is_score,
  max(created_at) as refreshed_through
from
  arka_lake.imaging_orders
group by
  institution_id,
  coalesce(cpt, '_unknown');

comment on materialized view arka_lake.institution_benchmarks is
  'Per-institution CPT benchmarks: appropriateness, MNAI green rate, duplicate proxy, mean IS (appropriateness) score.';

create unique index if not exists institution_benchmarks_institution_cpt_uidx
  on arka_lake.institution_benchmarks (institution_id, cpt);

create or replace function arka_lake.refresh_institution_benchmarks_mv ()
returns void
language sql
security invoker
set search_path = arka_lake, public
as $$
  refresh materialized view arka_lake.institution_benchmarks;
$$;

comment on function arka_lake.refresh_institution_benchmarks_mv () is
  'Refreshes institution_benchmarks after bulk lake loads; schedule nightly via cron or job runner.';

grant usage on schema arka_lake to service_role, authenticated;
grant all on table arka_lake.imaging_orders to service_role;
grant select on table arka_lake.imaging_orders to authenticated;
grant select on table arka_lake.institution_benchmarks to service_role, authenticated;
grant execute on function arka_lake.refresh_institution_benchmarks_mv () to service_role;

-- PostgREST-exposed wrapper (Supabase RPC defaults to `public` schema).
create or replace function public.refresh_institution_benchmarks_mv ()
returns void
language sql
security invoker
set search_path = arka_lake, public
as $$
  select arka_lake.refresh_institution_benchmarks_mv ();
$$;

comment on function public.refresh_institution_benchmarks_mv () is
  'Refreshes arka_lake.institution_benchmarks; schedule nightly after lake bulk loads.';

grant execute on function public.refresh_institution_benchmarks_mv () to service_role;
