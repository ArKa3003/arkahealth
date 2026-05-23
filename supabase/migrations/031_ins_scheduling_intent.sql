-- ARKA-INS: scheduling-intent queue for unscheduled imaging order capture (hashed ids only; no PHI).

create type public.scheduling_status as enum (
  'pending',
  'in_progress',
  'scheduled',
  'cancelled',
  'sla_breached'
);

create table if not exists public.ins_scheduling_intent (
  id uuid primary key default gen_random_uuid(),
  order_hash text not null unique,
  patient_hash text not null,
  created_at timestamptz not null default now(),
  sla_expires_at timestamptz not null,
  status public.scheduling_status not null default 'pending',
  cpt text,
  modality text,
  body_part text,
  scheduled_appointment_hash text,
  updated_at timestamptz not null default now(),
  constraint ins_scheduling_intent_order_hash_sha256 check (order_hash ~ '^[a-fA-F0-9]{64}$'),
  constraint ins_scheduling_intent_patient_hash_sha256 check (patient_hash ~ '^[a-fA-F0-9]{64}$')
);

comment on table public.ins_scheduling_intent is 'Post–order-sign scheduling queue keyed by hashed order/patient; reconciled against FHIR Appointment.';

create index if not exists ins_scheduling_intent_status_sla_idx
  on public.ins_scheduling_intent (status, sla_expires_at);

alter table public.ins_scheduling_intent enable row level security;

create policy "service role full access ins_scheduling_intent"
  on public.ins_scheduling_intent for all
  using (auth.role() = 'service_role');

create policy "authenticated read ins_scheduling_intent"
  on public.ins_scheduling_intent for select
  to authenticated
  using (true);

grant select on table public.ins_scheduling_intent to authenticated;

alter type public.ins_validation_event_type add value if not exists 'scheduling_intent_breach';
