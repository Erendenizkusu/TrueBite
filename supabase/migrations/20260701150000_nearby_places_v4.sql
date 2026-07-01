-- 20260701150000_nearby_places_v4.sql
-- TrueBite — nearby_places v4: gece-hayatı (types bazlı) elemesi ekler.
--
-- v3 sorunu (gerçek sorguda): "Café in The City" (primaryType 'restaurant' = generic, ama
-- types'ında sushi_restaurant + cocktail_bar + bar) sushi listesinde kaldı. Odaklı bir sushi
-- mekânı değil, sushi de yapan bir kokteyl/Asya barı → iyi sushi arayanı yanlış yönlendirir.
--
-- v4 kuralı (ek): mekânın types dizisinde GÜÇLÜ gece-hayatı türü (cocktail_bar, wine_bar,
-- night_club, live_music_venue, concert_hall…) varsa — primaryType generic olsa bile — elenir.
-- Düz "bar" KASITLI hariç (normal restoranların bar counter'ı için types'ında olabilir).

drop function if exists public.nearby_places(
  double precision, double precision, integer, integer, text[], text[], text[], boolean
);

create or replace function public.nearby_places(
  p_lat                 double precision,
  p_lng                 double precision,
  p_radius_m            integer default 1500,
  p_limit               integer default 50,
  p_types               text[]  default null,   -- kategori alakalı türleri; null = Tümü
  p_excluded_primaries  text[]  default null,   -- daima elenen primaryType'lar (bar/sahne)
  p_excluded_types      text[]  default null,   -- daima elenen types (gece-hayatı sinyalleri)
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
  region as (
    select
      p.*,
      st_distance(p.location, q.g) as dist_m
    from public.places p, q
    where st_dwithin(p.location, q.g, p_radius_m)
      and (p.business_status is null or p.business_status = 'OPERATIONAL')
  ),
  stats as (
    select
      avg(rating)             as c_mean,
      avg(user_ratings_total) as m_conf
    from region
    where user_ratings_total > 0 and rating is not null
  )
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
    -- (2) bar/sahne/etkinlik primaryType'ı daima elenir
    and (
      p_excluded_primaries is null
      or r.primary_type is null
      or not (r.primary_type = any(p_excluded_primaries))
    )
    -- (2b) güçlü gece-hayatı sinyali types'ta varsa daima elenir (primary generic olsa bile)
    and (
      p_excluded_types is null
      or not (r.types && p_excluded_types)
    )
    -- (3) kategori alaka: tür kesişimi (Tümü'de kısıt yok)
    and (p_types is null or r.types && p_types)
    -- (4) asıl-iş kapısı: primaryType uygun mu
    and (
      p_types is null
      or (p_strict_primary
            and r.primary_type = any(p_types))
      or (not p_strict_primary and (
            r.primary_type is null
            or r.primary_type = any(p_types)
            or p_specific_primaries is null
            or not (r.primary_type = any(p_specific_primaries))
          ))
    )
  order by real_score desc nulls last, r.user_ratings_total desc
  limit p_limit;
$$;

comment on function public.nearby_places is
  'Yarıçap içindeki mekânları "asıl işi o kategori" precision kuralı (tür kesişimi + primaryType kapısı + bar/gece-hayatı/hayalet eleme) ile Bayesyen RealScore''a göre sıralar. Tek sorguda, DB içinde.';
