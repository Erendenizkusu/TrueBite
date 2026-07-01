-- 20260701130000_nearby_places_v2.sql
-- TrueBite — nearby_places: KESİN kategori filtresi (precision) + Bayesyen RealScore.
--
-- DEĞİŞİKLİK (v1 → v2): Eski filtre `p_type = primary_type OR p_type = any(types)` idi;
-- bu, types dizisinde tür geçen HER mekânı alıyordu → "sushi servis eden bar" (primaryType
-- 'live_music_venue', types'ında 'sushi_restaurant') yanlışlıkla sushi sonucu oluyordu.
--
-- YENİ "dengeli" kural (gerçekçilik için kalibre edildi):
--   Bir mekân kategoriye girer  ⟺
--     (p_types) ∩ (mekân.types) ≠ ∅                         [alaka: tür kesişimi]
--     VE  primary_type ∉ p_excluded_primaries               [gerçek yemek işletmesi, bar/mekân değil]
--
--   Ono (primaryType 'restaurant', types'ında 'sushi_restaurant')  → ✓ (kesişim var, primary bar değil)
--   Rotown (primaryType 'live_music_venue', types'ında 'sushi')    → ✗ (primary eleme listesinde)
--   Number Ten (primaryType 'coffee_shop')                          → ✓
--
-- Skorlama (RealScore) ve geo filtre DAİMA burada, DB içinde. Bölge istatistiği (C, m)
-- yarıçaptaki TÜM operasyonel mekânlar üzerinden (tür filtresinden ÖNCE) alınır — shrink
-- tabanı gerçek bölgeyi yansıtsın.

-- Eski imzayı (p_type text) düşür; yeni imza dizi parametreleri alır.
drop function if exists public.nearby_places(double precision, double precision, integer, integer, text);

create or replace function public.nearby_places(
  p_lat                 double precision,
  p_lng                 double precision,
  p_radius_m            integer default 1500,
  p_limit               integer default 50,
  p_types               text[]  default null,   -- kategori alakalı türleri; null = Tümü
  p_excluded_primaries  text[]  default null    -- primaryType'ı bunlardan biriyse elenir (bar/mekân)
)
returns table (
  place_id            text,
  name                text,
  lat                 double precision,
  lng                 double precision,
  rating              numeric,
  user_ratings_total  integer,
  distance_m          double precision,
  real_score          numeric
)
language sql
stable
security definer
set search_path = extensions, public, pg_temp
as $$
  with q as (
    select st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography as g
  ),
  -- 1) Yarıçap içindeki operasyonel mekânlar (PostGIS, metre cinsinden).
  region as (
    select
      p.*,
      st_distance(p.location, q.g) as dist_m
    from public.places p, q
    where st_dwithin(p.location, q.g, p_radius_m)
      and (p.business_status is null or p.business_status = 'OPERATIONAL')
  ),
  -- 2) Bölge istatistiği — C ve m. (Tür filtresinden ÖNCE: taban tüm mekânları yansıtsın.)
  stats as (
    select
      avg(rating)             as c_mean,   -- C: bölge ortalama puanı
      avg(user_ratings_total) as m_conf    -- m: bölge ortalama yorum sayısı
    from region
    where user_ratings_total > 0 and rating is not null
  )
  -- 3) RealScore hesapla, KESİN kategori filtresi uygula, sırala.
  select
    r.place_id,
    r.name,
    st_y(r.location::geometry) as lat,
    st_x(r.location::geometry) as lng,
    r.rating,
    r.user_ratings_total,
    round(r.dist_m::numeric, 1) as distance_m,
    round(
      ( r.user_ratings_total * coalesce(r.rating, s.c_mean) + s.m_conf * s.c_mean )
      / nullif(r.user_ratings_total + s.m_conf, 0)
    , 3) as real_score
  from region r, stats s
  where
    -- alaka: kategori türleri ile mekânın types dizisi kesişiyor mu (Tümü'de kısıt yok)
    (p_types is null or r.types && p_types)
    -- gerçek yemek işletmesi: primaryType bir bar/sahne/etkinlik mekânı değil
    and (
      p_excluded_primaries is null
      or r.primary_type is null
      or not (r.primary_type = any(p_excluded_primaries))
    )
  order by real_score desc nulls last, r.user_ratings_total desc
  limit p_limit;
$$;

comment on function public.nearby_places is
  'Yarıçap içindeki mekânları KESİN kategori filtresi (tür kesişimi + bar/mekân eleme) ile Bayesyen RealScore''a göre sıralar. Geo filtre + skor tek sorguda, DB içinde.';
