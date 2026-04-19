-- ARKA-INS: optional JSON metadata and additional ROI event types for validation metrics API.

alter table public.ins_validation_events
add column if not exists metadata jsonb not null default '{}'::jsonb;

comment on column public.ins_validation_events.metadata is 'Structured context for ROI metrics (scores, OOP, override codes); no PHI.';

alter type public.ins_validation_event_type add value if not exists 'dtr_denial_risk_reduced';

alter type public.ins_validation_event_type add value if not exists 'alternative_imaging_avoided';

alter type public.ins_validation_event_type add value if not exists 'patient_deferred_high_oop';

alter type public.ins_validation_event_type add value if not exists 'oop_estimate_presented';

alter type public.ins_validation_event_type add value if not exists 'provider_override';
