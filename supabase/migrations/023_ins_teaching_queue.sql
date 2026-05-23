-- ARKA-INS: opt-in interesting cases for teaching / QI (hashed ids + redacted snapshot only).

create table if not exists public.ins_teaching_queue (
  id uuid primary key default gen_random_uuid(),
  patient_hash text not null,
  rarity_score numeric not null,
  drivers jsonb not null,
  snapshot_redacted jsonb not null,
  added_by_hash text not null,
  created_at timestamptz not null default now()
);

comment on table public.ins_teaching_queue is
  'De-identified interesting cases flagged by clinicians; no PHI — hashed patient and submitter only.';

create index if not exists idx_ins_teaching_queue_created_at on public.ins_teaching_queue (created_at desc);

alter table public.ins_teaching_queue enable row level security;

create policy ins_teaching_queue_select_education on public.ins_teaching_queue
for select
to authenticated
using ((auth.jwt() ->> 'role') = 'education_committee');

create policy ins_teaching_queue_insert_authenticated on public.ins_teaching_queue
for insert
to authenticated
with check (true);

create policy ins_teaching_queue_service_role on public.ins_teaching_queue
for all
to service_role
using (true)
with check (true);

grant select on table public.ins_teaching_queue to authenticated;
grant insert on table public.ins_teaching_queue to authenticated;
