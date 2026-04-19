-- ARKA-INS: store PAS ClaimResponse JSON for Provider Access API GET replay.

alter table public.ins_pa_history
add column if not exists pas_response jsonb;

comment on column public.ins_pa_history.pas_response is 'Serialized PASResponse (ClaimResponse + CMS-0057-F metadata); no PHI.';
