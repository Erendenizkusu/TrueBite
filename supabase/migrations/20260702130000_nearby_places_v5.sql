-- 20260702130000_nearby_places_v5.sql
-- TrueBite — nearby_places v5: kalibrasyon (gerçek-veri geri bildirimiyle).
--
-- Üç değişiklik (hepsi TS ikizi packages/scoring/realScore.ts ile BİREBİR senkron):
--
-- (1) YORUM-AĞIRLIKLI bölge ortalaması C:
--       eski: C = avg(rating)                (her mekân eşit → az-yorumlu şişirilmiş 5.0'lar
--                                              prior'ı yukarı çeker, shrink zayıflar)
--       yeni: C = Σ(rating·v) / Σ(v)         (bir puan kaç kişiden geldiyse o kadar ağırlık →
--                                              prior artık ince-örnekli şişirmeye kanmaz)
--     Kanıt (kullanıcı senaryosu): 9 mekân 5.0/5-yorum + 1 mekân 4.6/1000-yorum →
--       düz avg C≈4.96 (sahteler kazanır); ağırlıklı C≈4.62 (gerçek kazanmaya başlar).
--
-- (2) KANITLANMIŞLIK/GÜVEN terimi (β, p_trust_weight):
--       FinalScore = RealScore + β·( log10(1+v) − log10(1+m) )
--     Bölgeye göreli: tipik-üstü yorumlu (kanıtlanmış) mekâna +, ince-örnekliye küçük −.
--     RealScore matematiksel olarak [R,C] aralığında sıkışır → bölge ortalaması altında ama
--     ÇOK yorumlu (1300 yorum, 4.2) kanıtlanmış markaları saf Bayesyen asla öne taşıyamaz.
--     Bu terim bunu çözer. "Yorum sayısı = taklit edilemez güven" → markayla uyumlu.
--     [0,5] clamp: aşırı-hacimli popüler mekânlarda skor 5'i aşmasın (gösterim tutarlılığı).
--
-- (3) AD-bazlı filtre (p_name_include / p_name_exclude):
--     Çiğ köftecilerin Google'da ayrı türü YOK (döner gibi 'turkish_restaurant'). Döner ile
--     çiğ köfteyi ayıran tek güvenilir sinyal ADT'ır → ad regex'iyle döner'den çıkar / çiğ
--     köfte kategorisine dahil et. (bkz. packages/shared/categories.ts CIGKOFTE_NAME_PATTERN)

-- Önceki imzaları düşür (v4: 9-arg, v3/v2: 8-arg).
drop function if exists public.nearby_places(
  double precision, double precision, integer, integer, text[], text[], text[], text[], boolean
);
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
  p_strict_primary      boolean default false,  -- true: primaryType ∈ p_types zorunlu (kahve/tatlı)
  p_name_include        text    default null,   -- yalnız adı bu regex'e uyanlar (çiğ köfte)
  p_name_exclude        text    default null,   -- adı bu regex'e uyanlar elenir (dönerden çiğ köfte çıkar)
  p_trust_weight        numeric default 0.25    -- β: kanıtlanmışlık/güven terimi ağırlığı (0 = kapalı)
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
      -- (1) yorum-AĞIRLIKLI bölge ortalaması: bir puan kaç kişiden geldiyse o kadar sayar
      sum(rating * user_ratings_total) / nullif(sum(user_ratings_total), 0) as c_mean,
      -- m: tipik yorum sayısı (güven eşiği) — düz ortalama kalır (prior "gücü", hacim değil)
      avg(user_ratings_total)                                               as m_conf
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
    -- (2) FinalScore = Bayesyen RealScore + güven terimi, [0,5]'e sıkıştırılmış
    round(
      least(5.0, greatest(0.0,
        ( r.user_ratings_total * r.rating + s.m_conf * s.c_mean )
        / nullif(r.user_ratings_total + s.m_conf, 0)
        + coalesce(p_trust_weight, 0) * (
            log((1 + r.user_ratings_total)::numeric) - log((1 + s.m_conf)::numeric)
          )
      ))
    , 3) as real_score
  from region r, stats s
  where
    -- (1) yalnızca gerçek puanı olan mekânlar (puansız hayaletleri ele)
    r.rating is not null
    -- (3a) ad dahil et: yalnız adı desene uyanlar (çiğ köfte kategorisi)
    and (p_name_include is null or r.name ~* p_name_include)
    -- (3b) ad hariç tut: adı desene uyanlar elenir (dönerden çiğ köfte çıkar)
    and (p_name_exclude is null or r.name !~* p_name_exclude)
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
  'Yarıçap içindeki mekânları "asıl işi o kategori" precision kuralı (tür kesişimi + primaryType kapısı + ad regex + bar/gece-hayatı/hayalet eleme) ile, yorum-ağırlıklı Bayesyen RealScore + kanıtlanmışlık/güven terimine (β) göre sıralar. Tek sorguda, DB içinde.';
