-- ARKA-INS: validation / ROI events and monthly rollup (refresh MV after bulk loads).

create type public.ins_validation_event_type as enum(
  'pa_submitted',
  'pa_avoided_by_gold_card',
  'pa_avoided_by_crd',
  'appeal_won',
  'oop_savings_realized',
  'provider_time_saved',
  'gold_card_check'
);

create table if not exists public.ins_validation_events (
  id uuid primary key default gen_random_uuid (),
  event_type public.ins_validation_event_type not null,
  provider_id uuid references public.ins_providers (id) on delete set null,
  payer_id text,
  amount_usd numeric,
  minutes_saved integer,
  occurred_at timestamptz not null default now()
);

comment on table public.ins_validation_events is 'Product validation metrics; optional provider/payer context only; no PHI.';

create index if not exists idx_ins_validation_events_occurred_at on public.ins_validation_events (occurred_at desc);
create index if not exists idx_ins_validation_events_type on public.ins_validation_events (event_type);
create index if not exists idx_ins_validation_events_provider_id on public.ins_validation_events (provider_id);

alter table public.ins_validation_events enable row level security;

create policy ins_validation_events_select_authenticated on public.ins_validation_events for select to authenticated using (true);

grant select on table public.ins_validation_events to authenticated;

create materialized view public.mv_ins_roi_summary as
select
  date_trunc('month', occurred_at)::timestamptz as month_start,
  coalesce(
    sum(amount_usd) filter (
      where
        event_type in ('oop_savings_realized', 'appeal_won')
    ),
    0
  )::numeric(16, 2) as total_savings_usd,
  coalesce(sum(minutes_saved), 0)::bigint as total_minutes_saved,
  count(*) filter (
    where
      event_type in ('pa_avoided_by_gold_card', 'pa_avoided_by_crd')
  )::bigint as pas_avoided_count
from
  public.ins_validation_events
group by
  1;

comment on materialized view public.mv_ins_roi_summary is 'Monthly ROI rollup from ins_validation_events; REFRESH MATERIALIZED VIEW after inserts.';

create unique index if not exists idx_mv_ins_roi_summary_month on public.mv_ins_roi_summary (month_start);

grant select on table public.mv_ins_roi_summary to authenticated;
