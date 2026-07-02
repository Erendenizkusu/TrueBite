-- 20260702120000_usage_cost_safety.sql
-- TrueBite — MALİYET GÜVENLİĞİ KATMANI (RELEASE.md § A / altın kural).
--
-- ALTIN KURAL (CLAUDE.md → Monetizasyon): uygulama ay sonunda kazandığından fazla maliyet
-- ÇIKARMAMALI. İki bağımsız sayaç bu kuralı teknik olarak zorlar:
--   1) usage_global  — GÜNLÜK gerçek Google Places çağrı sayısı (asıl maliyet) → sert bütçe tavanı.
--   2) usage_user    — kullanıcı(cihaz)-başına GÜNLÜK istek sayısı → adil kota + reklam kaldıracı.
--
-- Tüm sayaç fonksiyonları YAZMA yapar → SECURITY DEFINER + yalnızca service_role (backend).
-- Tablolar RLS-kilitli (politika yok); erişim sadece bu RPC'ler üzerinden.

-- ─────────────────────────────────────────────────────────────────────────────
-- Tablolar
-- ─────────────────────────────────────────────────────────────────────────────

-- Global günlük maliyet sayacı: gün başına toplam Google çağrısı + istek.
create table if not exists public.usage_global (
  day           date        primary key,
  google_calls  integer     not null default 0,   -- o gün yapılan gerçek Google Places çağrısı
  requests      integer     not null default 0,    -- o gün cache-miss ile sonuçlanan istek sayısı
  updated_at    timestamptz not null default now()
);

-- Kullanıcı(cihaz)-başına günlük kullanım. client_id = cihaz kimliği / anon uuid / IP (fallback).
create table if not exists public.usage_user (
  client_id     text        not null,
  day           date        not null,
  requests      integer     not null default 0,    -- o gün tüketilen istek (hit + miss)
  ad_grants     integer     not null default 0,    -- reklam izleyerek kazanılan ek istek hakkı
  updated_at    timestamptz not null default now(),
  primary key (client_id, day)
);

-- Eski satırların temizliği / günlük raporlama için.
create index if not exists usage_user_day_idx on public.usage_user (day);

alter table public.usage_global enable row level security;
alter table public.usage_user  enable row level security;

comment on table public.usage_global is
  'Günlük global Google Places çağrı/istek sayacı — sert maliyet tavanı (altın kural).';
comment on table public.usage_user is
  'Cihaz-başına günlük istek + reklam-kazanımı kotası. Erişim yalnızca RPC ile.';

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: consume_user_request — kullanıcı kotasını atomik tüketir.
--   effective_limit = p_free_per_day + o günkü ad_grants
--   used >= limit  → {allowed:false, reason:'quota_exceeded'} (SAYACI ARTIRMAZ)
--   aksi halde     → requests += 1, {allowed:true, remaining}
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.consume_user_request(
  p_client_id    text,
  p_free_per_day integer default 2
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_requests int;
  v_grants   int;
  v_limit    int;
begin
  if p_client_id is null or length(trim(p_client_id)) = 0 then
    p_client_id := 'unknown';
  end if;

  -- Satırı oluştur (yoksa) ve kilitle (aynı cihazın eşzamanlı istekleri yarışmasın).
  insert into public.usage_user (client_id, day)
    values (p_client_id, current_date)
    on conflict (client_id, day) do nothing;

  select requests, ad_grants into v_requests, v_grants
    from public.usage_user
    where client_id = p_client_id and day = current_date
    for update;

  v_limit := greatest(p_free_per_day, 0) + coalesce(v_grants, 0);

  if v_requests >= v_limit then
    return jsonb_build_object(
      'allowed', false, 'reason', 'quota_exceeded',
      'used', v_requests, 'limit', v_limit, 'remaining', 0
    );
  end if;

  update public.usage_user
    set requests = requests + 1, updated_at = now()
    where client_id = p_client_id and day = current_date;

  return jsonb_build_object(
    'allowed', true, 'reason', null,
    'used', v_requests + 1, 'limit', v_limit, 'remaining', v_limit - v_requests - 1
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: grant_ad_request — reklam izleme karşılığı ek istek hakkı tanır.
--   NOT: Üretimde bu çağrı AdMob sunucu-taraflı doğrulama (SSV) ile KORUNMALI
--   (aksi halde herkes bedava kota üretir). Şu an MVP/yerel için açık stub.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.grant_ad_request(
  p_client_id text,
  p_grant     integer default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_requests int;
  v_grants   int;
begin
  if p_client_id is null or length(trim(p_client_id)) = 0 then
    p_client_id := 'unknown';
  end if;

  insert into public.usage_user (client_id, day, ad_grants)
    values (p_client_id, current_date, greatest(p_grant, 0))
    on conflict (client_id, day) do update
      set ad_grants = public.usage_user.ad_grants + greatest(p_grant, 0),
          updated_at = now();

  select requests, ad_grants into v_requests, v_grants
    from public.usage_user
    where client_id = p_client_id and day = current_date;

  return jsonb_build_object(
    'granted', greatest(p_grant, 0),
    'used', v_requests,
    'grants', v_grants,
    'remaining_grants', v_grants
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: try_consume_budget — global maliyet tavanını atomik kontrol + tüketir.
--   Cache-miss'ten ÖNCE, Google'a gitmeden çağrılır. Günlük VE aylık tavanı korur.
--   tavan aşılırsa → {allowed:false} (Google'a gidilmez, bayat/DB verisi servis edilir).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.try_consume_budget(
  p_calls          integer,
  p_daily_budget   integer,
  p_monthly_budget integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_today int;
  v_month int;
begin
  insert into public.usage_global (day)
    values (current_date)
    on conflict (day) do nothing;

  select google_calls into v_today
    from public.usage_global
    where day = current_date
    for update;

  select coalesce(sum(google_calls), 0) into v_month
    from public.usage_global
    where day >= date_trunc('month', current_date)::date;

  if v_today + p_calls > p_daily_budget
     or v_month + p_calls > p_monthly_budget then
    return jsonb_build_object(
      'allowed', false,
      'day_calls', v_today, 'day_budget', p_daily_budget,
      'month_calls', v_month, 'month_budget', p_monthly_budget
    );
  end if;

  update public.usage_global
    set google_calls = google_calls + p_calls,
        requests     = requests + 1,
        updated_at   = now()
    where day = current_date;

  return jsonb_build_object(
    'allowed', true,
    'day_calls', v_today + p_calls, 'day_budget', p_daily_budget,
    'month_calls', v_month + p_calls, 'month_budget', p_monthly_budget
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Erişim: hepsi YAZMA → yalnızca backend (service_role). public'ten geri al.
-- ─────────────────────────────────────────────────────────────────────────────
revoke execute on function public.consume_user_request(text, integer) from public;
revoke execute on function public.grant_ad_request(text, integer)      from public;
revoke execute on function public.try_consume_budget(integer, integer, integer) from public;

grant execute on function public.consume_user_request(text, integer) to service_role;
grant execute on function public.grant_ad_request(text, integer)      to service_role;
grant execute on function public.try_consume_budget(integer, integer, integer) to service_role;
