-- ARKA-INS: gold-card eligibility scores per provider / CPT / payer.

create table if not exists public.ins_gold_card_scores (
  id uuid primary key default gen_random_uuid (),
  provider_id uuid not null references public.ins_providers (id) on delete restrict,
  cpt_code text not null,
  payer_id text not null,
  approval_rate numeric,
  sample_size integer not null default 0,
  score numeric not null,
  eligible boolean not null default false,
  computed_at timestamptz not null default now(),
  valid_until timestamptz,
  constraint ins_gold_card_scores_provider_cpt_payer unique (provider_id, cpt_code, payer_id),
  constraint ins_gold_card_scores_score_range check (score >= 0 and score <= 100)
);

comment on table public.ins_gold_card_scores is 'Aggregated PA approval metrics; no PHI.';

create index if not exists idx_ins_gold_card_scores_valid_until on public.ins_gold_card_scores (valid_until);

alter table public.ins_gold_card_scores enable row level security;

create policy ins_gold_card_scores_select_authenticated on public.ins_gold_card_scores for select to authenticated using (true);

grant select on table public.ins_gold_card_scores to authenticated;
