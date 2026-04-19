-- Allows service-role jobs (e.g. demo seed) to refresh ROI rollup after bulk loads.

create or replace function public.refresh_ins_roi_summary_mv ()
returns void
language sql
security invoker
set search_path = public
as $$
  refresh materialized view public.mv_ins_roi_summary;
$$;

comment on function public.refresh_ins_roi_summary_mv () is
  'Refreshes mv_ins_roi_summary after ins_validation_events bulk inserts; callable by service_role only via grants.';

grant execute on function public.refresh_ins_roi_summary_mv () to service_role;
