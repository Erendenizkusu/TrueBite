-- 20260630120300_nearby_places.sql
-- TrueBite — Çekirdek algoritma: yarıçap filtresi + Bayesyen RealScore, TEK SORGUDA, DB içinde.
--
-- RealScore = (v / (v + m)) * R + (m / (v + m)) * C
--           = (v*R + m*C) / (v + m)
--
--   R = mekanın ham puanı (rating)
--   v = mekanın yorum sayısı (user_ratings_total)
--   C = bölge ortalama puanı  (sorgu yarıçapındaki mekanların ortalaması) — prior
--   m = bölgenin ortalama yorum sayısı (dinamik güven eşiği)        — prior ağırlığı
--
-- Davranış: v küçükken skor C'ye çekilir (az-yorumlu şişirilmiş 5.0'lar bastırılır);
-- v büyüdükçe R baskın hale gelir. C ve m HER SORGU BÖLGESİNE GÖRE DİNAMİK hesaplanır.
--
-- KALİBRASYON NOTU: "4500 yorumlu 4.6" mekanın "5 yorumlu 5.0" mekanı geçmesi, C'nin
-- bölgenin GERÇEK tabanını (vasat mekanlar dahil) yansıtmasına bağlıdır. C yalnızca
-- iyi mekanların ortalaması olursa shrink zayıf kalır. Bu yüzden bölge istatistiği
-- TÜM operasyonel mekanlar üzerinden alınır.

create or replace function public.nearby_places(
  p_lat       double precision,
  p_lng       double precision,
  p_radius_m  integer default 1500,
  p_limit     integer default 50,
  p_type      text    default null
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
  -- 1) Yarıçap içindeki operasyonel mekanlar (PostGIS, metre cinsinden).
  region as (
    select
      p.*,
      st_distance(p.location, q.g) as dist_m
    from public.places p, q
    where st_dwithin(p.location, q.g, p_radius_m)
      and (p.business_status is null or p.business_status = 'OPERATIONAL')
  ),
  -- 2) Bölge istatistiği — C ve m. (Tür filtresinden ÖNCE: taban tüm mekanları yansıtsın.)
  stats as (
    select
      avg(rating)             as c_mean,   -- C: bölge ortalama puanı
      avg(user_ratings_total) as m_conf    -- m: bölge ortalama yorum sayısı
    from region
    where user_ratings_total > 0 and rating is not null
  )
  -- 3) RealScore hesapla, isteğe bağlı tür filtresi uygula, sırala.
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
  where (p_type is null or p_type = r.primary_type or p_type = any(r.types))
  order by real_score desc nulls last, r.user_ratings_total desc
  limit p_limit;
$$;

comment on function public.nearby_places is
  'Yarıçap içindeki mekanları Bayesyen RealScore ile sıralar. Geo filtre + skor tek sorguda, DB içinde.';
