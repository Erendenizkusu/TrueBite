-- 20260701140000_nearby_places_v3.sql
-- TrueBite — nearby_places v3: "asıl işi o kategori" precision + puansız hayaletleri ele.
--
-- v2 sorunları (gerçek sorguda görüldü):
--   • "Café in The City" (primaryType 'cafe', types'ında sushi_restaurant) sushi'de çıktı
--     — bir kafe, sushi mekânı değil. types-kesişimi tek başına yetmiyor.
--   • "Royal Sushi" (0 yorum, rating NULL) Bayesyen prior'dan (C) puan alıp listeye girdi.
--
-- v3 kuralı:
--   1. rating IS NOT NULL — puansız/0-yorumlu hayaletler listelenmez (Bayesyen düşük-yorumluları
--      zaten C'ye çekip aşağı sıralar; ama HİÇ puanı olmayanı göstermeyiz).
--   2. Bar/sahne/etkinlik primaryType'ları daima elenir (p_excluded_primaries).
--   3. Kategori alaka: p_types ∩ mekân.types (Tümü'de kısıt yok).
--   4. Cross-kategori kapısı (primaryType asıl işi belli eder):
--        - KATI (p_strict_primary, kahve/tatlı): primaryType ∈ p_types olmalı.
--        - GEVŞEK (yemek kategorileri): primaryType ∈ p_types  VEYA  primaryType generic
--          (yani p_specific_primaries'te DEĞİL). Böylece Ono (primary 'restaurant') kabul
--          edilir; "Café in The City" (primary 'cafe' = spesifik, sushi değil) elenir.

drop function if exists public.nearby_places(
  double precision, double precision, integer, integer, text[], text[]
);

create or replace function public.nearby_places(
  p_lat                 double precision,
  p_lng                 double precision,
  p_radius_m            integer default 1500,
  p_limit               integer default 50,
  p_types               text[]  default null,   -- kategori alakalı türleri; null = Tümü
  p_excluded_primaries  text[]  default null,   -- daima elenen primaryType'lar (bar/sahne)
  p_specific_primaries  text[]  default null,   -- "spesifik işletme" türleri (cross-kategori kapısı)
  p_strict_primary      boolean default false   -- true: primaryType ∈ p_types zorunlu (kahve/tatlı)
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
  -- 3) RealScore hesapla, KESİN kategori + asıl-iş filtresi uygula, sırala.
  select
    r.place_id,
    r.name,
    st_y(r.location::geometry) as lat,
    st_x(r.location::geometry) as lng,
    r.rating,
    r.user_ratings_total,
    round(r.dist_m::numeric, 1) as distance_m,
    round(
      ( r.user_ratings_total * r.rating + s.m_conf * s.c_mean )
      / nullif(r.user_ratings_total + s.m_conf, 0)
    , 3) as real_score
  from region r, stats s
  where
    -- (1) yalnızca gerçek puanı olan mekânlar (puansız hayaletleri ele)
    r.rating is not null
    -- (2) bar/sahne/etkinlik daima elenir
    and (
      p_excluded_primaries is null
      or r.primary_type is null
      or not (r.primary_type = any(p_excluded_primaries))
    )
    -- (3) kategori alaka: tür kesişimi (Tümü'de kısıt yok)
    and (p_types is null or r.types && p_types)
    -- (4) asıl-iş kapısı: primaryType uygun mu
    and (
      p_types is null                                       -- Tümü: kapı yok
      or (p_strict_primary
            and r.primary_type = any(p_types))              -- katı: primary tam kategori türü
      or (not p_strict_primary and (
            r.primary_type is null
            or r.primary_type = any(p_types)                -- primary zaten kategori türü
            or p_specific_primaries is null
            or not (r.primary_type = any(p_specific_primaries)) -- ya da generic (spesifik değil)
          ))
    )
  order by real_score desc nulls last, r.user_ratings_total desc
  limit p_limit;
$$;

comment on function public.nearby_places is
  'Yarıçap içindeki mekânları "asıl işi o kategori" precision kuralı (tür kesişimi + primaryType kapısı + bar/hayalet eleme) ile Bayesyen RealScore''a göre sıralar. Geo filtre + skor tek sorguda, DB içinde.';
