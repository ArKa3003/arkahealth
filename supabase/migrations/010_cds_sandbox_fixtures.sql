-- Optional sandbox fixtures for `npm run test:sandbox` scenario 1 (Gold Card).
-- Apply to your Supabase project when running local or hosted CDS validation.

insert into public.ins_providers (id, npi, name, specialty, organization, state)
values (
    '11111111-1111-4111-8111-000000000001',
    '1003000126',
    'Sandbox Gold Clinician',
    'Orthopedic Surgery',
    'ARKA Sandbox Health',
    'CA'
  )
on conflict (npi) do update
set
  name = excluded.name,
  specialty = excluded.specialty;

insert into public.ins_gold_card_scores (
    provider_id,
    cpt_code,
    payer_id,
    approval_rate,
    sample_size,
    score,
    eligible,
    computed_at,
    valid_until
  )
values (
    '11111111-1111-4111-8111-000000000001',
    '72148',
    'aetna',
    0.95,
    24,
    92,
    true,
    now(),
    now() + interval '30 days'
  )
on conflict (provider_id, cpt_code, payer_id) do update
set
  approval_rate = excluded.approval_rate,
  sample_size = excluded.sample_size,
  score = excluded.score,
  eligible = excluded.eligible,
  computed_at = excluded.computed_at,
  valid_until = excluded.valid_until;
