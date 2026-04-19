-- ARKA-INS: negotiated allowed amount for payer comparison (no PHI).

alter table public.ins_shoppable_sites
  add column if not exists negotiated_rate numeric;

comment on column public.ins_shoppable_sites.negotiated_rate is
  'Representative in-network allowed amount for payer comparison; not a guarantee of member cost-sharing.';
