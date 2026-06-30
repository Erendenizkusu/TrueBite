-- 20260630120600_place_highlights.sql
-- TrueBite — AI "Öne Çıkan Özellikler" önbelleği.
--
-- AI'ın yorumlardan çıkardığı etiketler burada saklanır → ikinci kullanıcı için AI'a
-- tekrar para ödenmez (doğrudan DB'den). Bunlar DÖNÜŞTÜRÜLMÜŞ türev veridir (ham yorum
-- metnini yeniden üretmez); ham yorumlar AI'a geçici gönderilir, kalıcı tutulmaz (ToS).

create table if not exists public.place_highlights (
  place_id            text primary key references public.places(place_id) on delete cascade,
  tags                text[]      not null default '{}',  -- kontrollü sözlük etiketleri
  source_review_count integer     not null default 0,
  model               text,                               -- üreten model (örn. claude-haiku-4-5)
  generated_at        timestamptz not null default now()  -- TTL
);

alter table public.place_highlights enable row level security;

-- Taze etiketleri döndürür (yoksa/bayatsa NULL). Reviews yavaş değişir → TTL 7 gün.
create or replace function public.fresh_highlights(
  p_place_id text,
  p_ttl      interval default interval '7 days'
)
returns text[]
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select tags
  from public.place_highlights
  where place_id = p_place_id
    and generated_at > now() - p_ttl;
$$;

-- AI çıktısını yazar/yeniler.
create or replace function public.upsert_highlights(
  p_place_id text,
  p_tags     text[],
  p_count    integer,
  p_model    text
)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.place_highlights (place_id, tags, source_review_count, model, generated_at)
  values (p_place_id, p_tags, p_count, p_model, now())
  on conflict (place_id) do update set
    tags                = excluded.tags,
    source_review_count = excluded.source_review_count,
    model               = excluded.model,
    generated_at        = now();
$$;

-- Yazma yalnızca backend (service_role); okuma açık (türev veri).
revoke execute on function public.upsert_highlights(text, text[], integer, text) from public;
grant execute on function public.upsert_highlights(text, text[], integer, text) to service_role;

comment on table public.place_highlights is
  'AI öne çıkan özellik etiketleri önbelleği (türev veri). TTL 7 gün; ham yorum saklanmaz.';
