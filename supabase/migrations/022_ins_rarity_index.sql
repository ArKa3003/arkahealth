-- ARKA-INS: rolling rarity dimensions for interesting-case detection (no PHI).

alter table public.ins_validation_events
add column if not exists icd10_combo text,
add column if not exists cpt_combo text,
add column if not exists age_bucket text,
add column if not exists sex text,
add column if not exists region_bucket text,
add column if not exists redflag_combo text;

comment on column public.ins_validation_events.icd10_combo is 'Sorted ICD-10 key set for marginal rarity; no patient identifiers.';
comment on column public.ins_validation_events.cpt_combo is 'Ordered CPT key set for marginal rarity.';
comment on column public.ins_validation_events.age_bucket is 'Coarse age band for demographic rarity.';
comment on column public.ins_validation_events.sex is 'Administrative sex bucket for demographic rarity.';
comment on column public.ins_validation_events.region_bucket is 'Coarse geography bucket; never a street address.';
comment on column public.ins_validation_events.redflag_combo is 'Sorted active AIIE red-flag keys; no narrative PHI.';

create materialized view if not exists public.ins_rarity_index as
select
  icd10_combo,
  cpt_combo,
  age_bucket,
  sex,
  region_bucket,
  redflag_combo,
  count(*)::bigint as occurrences,
  now() as computed_at
from
  public.ins_validation_events
where
  occurred_at >= (now() - interval '365 days')
  and icd10_combo is not null
  and cpt_combo is not null
  and age_bucket is not null
  and sex is not null
  and region_bucket is not null
  and redflag_combo is not null
group by
  icd10_combo,
  cpt_combo,
  age_bucket,
  sex,
  region_bucket,
  redflag_combo;

comment on materialized view public.ins_rarity_index is
  '365-day joint frequency table for interesting-case rarity; REFRESH nightly via pg_cron or refresh_ins_rarity_index_mv().';

create unique index if not exists idx_ins_rarity_index_combo on public.ins_rarity_index (
  icd10_combo,
  cpt_combo,
  age_bucket,
  sex,
  region_bucket,
  redflag_combo
);

create index if not exists idx_ins_rarity_index_icd_cpt on public.ins_rarity_index (icd10_combo, cpt_combo);

grant select on table public.ins_rarity_index to authenticated;
grant select on table public.ins_rarity_index to service_role;

create or replace function public.refresh_ins_rarity_index_mv ()
returns void
language sql
security invoker
set search_path = public
as $$
  refresh materialized view public.ins_rarity_index;
$$;

comment on function public.refresh_ins_rarity_index_mv () is
  'Refreshes ins_rarity_index after bulk ins_validation_events loads; target <10s at ~100k rows.';

grant execute on function public.refresh_ins_rarity_index_mv () to service_role;
