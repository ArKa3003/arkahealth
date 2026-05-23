-- ARKA-INS: Radiopaedia + curated WebMD reference cache (pgvector; 30-day TTL in match RPC).

create extension if not exists vector;

create table if not exists public.ins_reference_webmd_corpus (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  url text not null,
  tags text[] not null default '{}',
  licensing text not null default 'WebMD Consumer Health Information',
  body jsonb not null default '{}'::jsonb,
  uploaded_at timestamptz not null default now()
);

comment on table public.ins_reference_webmd_corpus is 'Admin-uploaded WebMD consumer education JSON; never scraped live.';

create table if not exists public.ins_reference_cache (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('radiopaedia', 'webmd')),
  title text not null,
  excerpt text not null,
  url text not null,
  tags text[] not null default '{}',
  licensing text not null,
  embedding vector(384),
  fetched_at timestamptz not null default now(),
  constraint ins_reference_cache_source_url_key unique (source, url)
);

comment on table public.ins_reference_cache is 'Licensed reference excerpts + embeddings; background worker only.';

create index if not exists ins_reference_cache_embedding_idx
  on public.ins_reference_cache
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists ins_reference_cache_fetched_at_idx
  on public.ins_reference_cache (fetched_at desc);

alter table public.ins_reference_webmd_corpus enable row level security;
alter table public.ins_reference_cache enable row level security;

create policy "service role full access ins_reference_webmd_corpus"
  on public.ins_reference_webmd_corpus for all
  using (auth.role() = 'service_role');

create policy "service role full access ins_reference_cache"
  on public.ins_reference_cache for all
  using (auth.role() = 'service_role');

create or replace function public.match_ins_reference_cache(
  query_embedding vector(384),
  match_count int default 5
)
returns table (
  id uuid,
  source text,
  title text,
  excerpt text,
  url text,
  tags text[],
  licensing text,
  fetched_at timestamptz,
  similarity double precision
)
language sql
stable
as $$
  select
    c.id,
    c.source,
    c.title,
    c.excerpt,
    c.url,
    c.tags,
    c.licensing,
    c.fetched_at,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.ins_reference_cache c
  where c.embedding is not null
    and c.fetched_at > now() - interval '30 days'
  order by c.embedding <=> query_embedding
  limit greatest(1, least(match_count, 20));
$$;

comment on function public.match_ins_reference_cache is 'Cosine similarity search over fresh reference cache rows.';

grant execute on function public.match_ins_reference_cache(vector, int) to service_role;
