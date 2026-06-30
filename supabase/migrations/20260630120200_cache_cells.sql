-- 20260630120200_cache_cells.sql
-- TrueBite — `cache_cells`: bir bölgenin (grid hücresinin) en son ne zaman Google'dan
-- doldurulduğunu izler. Önbellek "hit/miss" kararı burada verilir.
--
-- TASARIM: Önbellek anahtarı ham lat/lng DEĞİLDİR (her sorgu benzersiz koordinat olur,
-- önbellek hiç tutmaz). Bunun yerine bir grid hücresi kimliği (geohash veya H3) kullanılır.
-- `cell_id` uygulama katmanında (packages/shared) hesaplanıp TEXT olarak saklanır; böylece
-- bu migration herhangi bir grid eklentisine bağımlı olmaz.

create table if not exists public.cache_cells (
  cell_id        text        not null,            -- geohash / H3 hücre kimliği
  radius_bucket  integer     not null default 0,  -- bucket'lanmış yarıçap (örn. metre/500)
  fetched_at     timestamptz not null default now(),
  place_count    integer     not null default 0,  -- bu doldurma sırasında yazılan mekan sayısı
  primary key (cell_id, radius_bucket)
);

create index if not exists cache_cells_fetched_at_idx
  on public.cache_cells (fetched_at);

-- Bir hücrenin önbelleği taze mi? (varsayılan TTL: 3 gün, Google'ın 30 gün limiti içinde)
create or replace function public.is_cell_fresh(
  p_cell_id       text,
  p_radius_bucket integer default 0,
  p_ttl           interval default interval '3 days'
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.cache_cells c
    where c.cell_id = p_cell_id
      and c.radius_bucket = p_radius_bucket
      and c.fetched_at > now() - p_ttl
  );
$$;

alter table public.cache_cells enable row level security;

comment on table public.cache_cells is
  'Grid hücresi başına son Google doldurma zamanı. Önbellek hit/miss kararı için (TTL 3 gün).';
