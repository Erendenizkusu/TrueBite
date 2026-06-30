-- 20260630120000_enable_postgis.sql
-- TrueBite — Geo-uzamsal altyapı ve yardımcı eklentiler.
--
-- Supabase best practice: eklentiler `public` yerine `extensions` şemasına kurulur.
-- Supabase'in `postgres` rolünün varsayılan search_path'i `extensions`i içerir, bu
-- yüzden `geography`, `st_dwithin`, `st_distance` gibi tipler/fonksiyonlar şema
-- niteleyici olmadan çözülebilir.

-- PostGIS: geo-radius (yarıçap) sorguları için. Mesafe hesapları metre cinsinden
-- doğrudan çalışsın diye GEOGRAPHY tipi kullanacağız.
create extension if not exists postgis with schema extensions;

-- moddatetime: updated_at sütununu otomatik güncelleyen trigger fonksiyonu sağlar.
create extension if not exists moddatetime with schema extensions;
