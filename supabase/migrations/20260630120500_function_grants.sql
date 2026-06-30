-- 20260630120500_function_grants.sql
-- TrueBite — RPC erişim kontrolü.
--
-- Fonksiyonlar SECURITY DEFINER (owner=postgres olarak çalışır → RLS-kilitli tablolara
-- erişebilir). Bu yüzden EXECUTE iznini bilinçli yönetiyoruz:
--   - YAZMA fonksiyonları (upsert_places, touch_cell): yalnızca backend (service_role).
--     anon/authenticated bunları çağıramaz (aksi halde herkes DB'ye yazabilirdi).
--   - OKUMA fonksiyonları (nearby_places, is_cell_fresh): herkese açık kalır — döndürdükleri
--     veri zaten public restoran bilgisi; ileride web/mobil doğrudan da okuyabilir.

revoke execute on function public.upsert_places(jsonb) from public;
revoke execute on function public.touch_cell(text, integer, integer) from public;

grant execute on function public.upsert_places(jsonb) to service_role;
grant execute on function public.touch_cell(text, integer, integer) to service_role;
