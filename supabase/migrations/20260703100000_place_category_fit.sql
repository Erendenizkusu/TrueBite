-- 20260703100000_place_category_fit.sql
-- TrueBite — AI "Kategori-Uyum Skoru" önbelleği.
--
-- KÖK SORUN: Google puanı TÜM mekânın; bir dönercinin 4.6'sı belki dönerinden değil
-- başka ürünlerinden. Kullanıcı "döner" için gidince pişman olabilir (Sultan/Beymen gibi
-- genel Türk restoranları döner listesinde). ÇÖZÜM: top-N mekân için yorumları AI'a ver →
-- "bu mekân ÖZELLİKLE {kategori}'de ne kadar iyi (0-1)?" → RealScore'u bununla ölçekle,
-- yeniden sırala. Skor (place_id, category) başına cache'lenir → ikinci kullanıcı AI'a
-- para ödemez. Türev veri (ham yorum saklanmaz, ToS).
--
-- MALİYET GÜVENLİĞİ (altın kural): özellik varsayılan KAPALI (config CATEGORY_FIT_TOP_N=0).
-- Açıkken review-fetch'ler global Google bütçesinden düşülür + cache ilk-getirmeden sonra bedava.

create table if not exists public.place_category_fit (
  place_id            text        references public.places(place_id) on delete cascade,
  category            text        not null,                 -- kategori key (örn. "doner")
  fit                 real        not null,                 -- 0..1 kategori-uyum skoru
  source_review_count integer     not null default 0,
  model               text,                                 -- üreten model (örn. gpt-4o-mini)
  generated_at        timestamptz not null default now(),   -- TTL
  primary key (place_id, category)
);

alter table public.place_category_fit enable row level security;

-- Taze fit skorunu döndürür (yoksa/bayatsa NULL). Reviews yavaş değişir → TTL 7 gün.
create or replace function public.fresh_category_fit(
  p_place_id text,
  p_category text,
  p_ttl      interval default interval '7 days'
)
returns real
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select fit
  from public.place_category_fit
  where place_id = p_place_id
    and category = p_category
    and generated_at > now() - p_ttl;
$$;

-- AI çıktısını yazar/yeniler.
create or replace function public.upsert_category_fit(
  p_place_id text,
  p_category text,
  p_fit      real,
  p_count    integer,
  p_model    text
)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.place_category_fit (place_id, category, fit, source_review_count, model, generated_at)
  values (p_place_id, p_category, p_fit, p_count, p_model, now())
  on conflict (place_id, category) do update set
    fit                 = excluded.fit,
    source_review_count = excluded.source_review_count,
    model               = excluded.model,
    generated_at        = now();
$$;

-- Yazma yalnızca backend (service_role); okuma açık (türev veri).
revoke execute on function public.upsert_category_fit(text, text, real, integer, text) from public;
grant execute on function public.upsert_category_fit(text, text, real, integer, text) to service_role;

comment on table public.place_category_fit is
  'AI kategori-uyum skoru önbelleği (türev veri). TTL 7 gün; ham yorum saklanmaz. Varsayılan kapalı.';
