-- 20260630120400_api_rpcs.sql
-- TrueBite — Backend orkestrasyonu için RPC'ler. Geography lat/lng'den SQL'de kurulur
-- (supabase-js geography serileştirmesiyle uğraşmamak için; hesap verinin yanında kalır).

-- upsert_places: Google'dan normalize edilmiş mekan dizisini (jsonb) places'e yazar.
-- Anahtarlar snake_case beklenir (place_id, formatted_address, user_ratings_total, ...).
create or replace function public.upsert_places(p_places jsonb)
returns integer
language sql
security definer
set search_path = extensions, public, pg_temp
as $$
  with rows as (
    select
      x.place_id,
      x.name,
      x.formatted_address,
      st_setsrid(st_makepoint(x.lng, x.lat), 4326)::geography as location,
      x.rating,
      coalesce(x.user_ratings_total, 0) as user_ratings_total,
      x.price_level,
      x.primary_type,
      case when jsonb_typeof(x.types) = 'array'
           then (select coalesce(array_agg(t), '{}') from jsonb_array_elements_text(x.types) t)
           else '{}'::text[] end as types,
      x.business_status
    from jsonb_to_recordset(p_places) as x(
      place_id            text,
      name                text,
      formatted_address   text,
      lat                 double precision,
      lng                 double precision,
      rating              numeric,
      user_ratings_total  integer,
      price_level         smallint,
      primary_type        text,
      types               jsonb,
      business_status     text
    )
  ),
  ins as (
    insert into public.places as p
      (place_id, name, formatted_address, location, rating, user_ratings_total,
       price_level, primary_type, types, business_status, fetched_at)
    select
      place_id, name, formatted_address, location, rating, user_ratings_total,
      price_level, primary_type, types, business_status, now()
    from rows
    where place_id is not null
    on conflict (place_id) do update set
      name               = excluded.name,
      formatted_address  = excluded.formatted_address,
      location           = excluded.location,
      rating             = excluded.rating,
      user_ratings_total = excluded.user_ratings_total,
      price_level        = excluded.price_level,
      primary_type       = excluded.primary_type,
      types              = excluded.types,
      business_status    = excluded.business_status,
      fetched_at         = now()
    returning 1
  )
  select count(*)::int from ins;
$$;

-- touch_cell: bir grid hücresinin önbellek tazeliğini günceller (cache-miss sonrası).
create or replace function public.touch_cell(
  p_cell_id       text,
  p_radius_bucket integer,
  p_place_count   integer default 0
)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.cache_cells (cell_id, radius_bucket, fetched_at, place_count)
  values (p_cell_id, p_radius_bucket, now(), p_place_count)
  on conflict (cell_id, radius_bucket) do update set
    fetched_at  = now(),
    place_count = excluded.place_count;
$$;
