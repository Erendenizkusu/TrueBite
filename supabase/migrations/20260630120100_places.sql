-- 20260630120100_places.sql
-- TrueBite — `places` tablosu: Google Places (New) verilerinin önbelleği.
--
-- ToS NOTU: Google Places (New) şartları, yer *içeriğinin* (rating, yorum sayısı,
-- isim, adres) saklanmasını maksimum 30 günle sınırlar; yalnızca `place_id` süresiz
-- saklanabilir. Bu tablo bir kalıcı veri ambarı DEĞİL, yenilenebilir bir önbellektir.
-- TTL kontrolü `fetched_at` üzerinden yapılır (varsayılan tazelik: 3 gün).

create table if not exists public.places (
  -- Google place_id — süresiz saklanabilen tek alan (ToS).
  place_id            text primary key,

  -- --- Yenilenebilir içerik alanları (ToS: max 30 gün) ---
  name                text        not null,
  formatted_address   text,
  -- GEOGRAPHY(Point, 4326): WGS84; ST_DWithin/ST_Distance metre cinsinden çalışır.
  location            geography(Point, 4326) not null,
  rating              numeric(2,1),          -- R: ham ortalama puan (0.0–5.0), yoksa NULL
  user_ratings_total  integer     not null default 0,  -- v: yorum sayısı
  price_level         smallint,              -- 0–4 (opsiyonel)
  primary_type        text,                  -- örn. 'restaurant', 'cafe'
  types               text[]      not null default '{}',
  business_status     text,                  -- 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | ...

  -- --- Önbellek / denetim alanları ---
  fetched_at          timestamptz not null default now(),  -- Google'dan son çekilme anı (TTL)
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Geo-radius sorgularının kalbi: GEOGRAPHY üzerinde GIST index.
create index if not exists places_location_gix
  on public.places using gist (location);

-- TTL/tazelik taramaları için.
create index if not exists places_fetched_at_idx
  on public.places (fetched_at);

-- Tür bazlı filtreleme (örn. yalnızca kahveciler) için.
create index if not exists places_types_gin
  on public.places using gin (types);

-- updated_at otomatik güncelleme.
drop trigger if exists handle_places_updated_at on public.places;
create trigger handle_places_updated_at
  before update on public.places
  for each row execute procedure extensions.moddatetime (updated_at);

-- --- Row Level Security ---
-- Politika EKLEMEDEN RLS açmak; anon/authenticated rollerine erişimi kapatır.
-- İstemciler (web/mobil) DB'ye doğrudan değil, Node backend üzerinden erişir; backend
-- `service_role` anahtarını kullanır ve RLS'i bypass eder. Güvenli varsayılan budur.
alter table public.places enable row level security;

comment on table public.places is
  'Google Places (New) önbelleği. ToS gereği içerik max 30 gün; place_id süresiz. Tazelik fetched_at ile yönetilir.';
