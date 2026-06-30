-- seed.sql — TrueBite yerel demo verisi (Kadıköy, İstanbul ~40.99, 29.03).
-- Çekirdek problemi kanıtlar: "5 yorumlu 5.0" şişirilmiş mekan, "4500 yorumlu 4.6"
-- köklü mekanın önüne GEÇMEMELİ. Bölgeye kasıtlı olarak vasat mekanlar da eklendi ki
-- bölge ortalaması C gerçekçi olsun (~4.27) ve Bayesyen shrink anlamlı çalışsın.

set search_path = extensions, public;

insert into public.places
  (place_id, name, location, rating, user_ratings_total, primary_type, types, business_status)
values
  ('demo_koklu',    'Köklü Lokanta',            st_setsrid(st_makepoint(29.0300, 40.9900),4326)::geography, 4.6, 4500, 'restaurant', '{restaurant}',        'OPERATIONAL'),
  ('demo_sisirilmis','Şişirilmiş Kafe',          st_setsrid(st_makepoint(29.0310, 40.9905),4326)::geography, 5.0,    5, 'cafe',       '{cafe}',              'OPERATIONAL'),
  ('demo_yeni',     'Yeni Açılan Burger',       st_setsrid(st_makepoint(29.0290, 40.9895),4326)::geography, 4.9,   12, 'restaurant', '{restaurant}',        'OPERATIONAL'),
  ('demo_zincir',   'Zincir Fast Food',         st_setsrid(st_makepoint(29.0320, 40.9890),4326)::geography, 3.4, 2100, 'restaurant', '{restaurant}',        'OPERATIONAL'),
  ('demo_esnaf',    'Ortalama Esnaf Lokantası', st_setsrid(st_makepoint(29.0280, 40.9910),4326)::geography, 3.9,  800, 'restaurant', '{restaurant}',        'OPERATIONAL'),
  ('demo_turist',   'Turist Tuzağı',            st_setsrid(st_makepoint(29.0305, 40.9885),4326)::geography, 4.1, 3200, 'restaurant', '{restaurant}',        'OPERATIONAL'),
  ('demo_kahveci',  'Üçüncü Nesil Kahveci',     st_setsrid(st_makepoint(29.0295, 40.9908),4326)::geography, 4.7,  950, 'cafe',       '{cafe,coffee_shop}',  'OPERATIONAL'),
  ('demo_pide',     'Mahalle Pidecisi',         st_setsrid(st_makepoint(29.0312, 40.9898),4326)::geography, 4.4, 1500, 'restaurant', '{restaurant}',        'OPERATIONAL'),
  ('demo_pahali',   'Pahalı Restoran',          st_setsrid(st_makepoint(29.0288, 40.9902),4326)::geography, 4.5,  600, 'restaurant', '{restaurant}',        'OPERATIONAL'),
  ('demo_sonuk',    'Sönük Mekan',              st_setsrid(st_makepoint(29.0318, 40.9912),4326)::geography, 3.2,  150, 'restaurant', '{restaurant}',        'OPERATIONAL')
on conflict (place_id) do nothing;

-- Doğrulama sorgusu (manuel çalıştır):
--   select name, rating, user_ratings_total, real_score, distance_m
--   from public.nearby_places(40.9900, 29.0300, 2000);
--
-- Beklenen sıralama (RealScore): Köklü Lokanta (~4.52) #1; Şişirilmiş Kafe (~4.27) çok geride.
-- Yalnızca kahveciler:  select * from public.nearby_places(40.9900, 29.0300, 2000, 50, 'cafe');
