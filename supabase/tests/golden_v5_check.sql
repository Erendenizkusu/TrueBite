-- Golden parite kontrolü (SQL ↔ TS twin), nearby_places v5.
-- Seed kadıköy demo verisi (10 mekân, merkez 40.9900, 29.0300) üzerinde FinalScore'ları
-- döker; beklenenle (packages/scoring/src/fixtures/kadikoy.ts KADIKOY_EXPECTED) karşılaştır.
--
-- Çalıştır:  supabase db reset && psql "<local-db-url>" -f supabase/tests/golden_v5_check.sql
--   veya Studio SQL editöründe (http://127.0.0.1:44323) aşağıdaki SELECT'i yapıştır.
--
-- Beklenen (β=0.25, yorum-ağırlıklı C≈4.227, m≈1381.7):
--   demo_koklu 4.641 | demo_kahveci 4.379 | demo_pide 4.326 | demo_turist 4.230
--   demo_pahali 4.219 | demo_esnaf 4.048 | demo_sonuk 3.886 | demo_zincir 3.774
--   demo_yeni 3.726 | demo_sisirilmis 3.639   (sıralama da bu → drift yoksa BİREBİR)

select
  place_id,
  name,
  rating,
  user_ratings_total as v,
  real_score
from public.nearby_places(
  40.9900,   -- p_lat  (kadıköy demo merkezi)
  29.0300,   -- p_lng
  5000,      -- p_radius_m (10 mekânın hepsini kapsar)
  50         -- p_limit; kalan paramlar default (β=0.25, filtre yok → TS twin ile aynı)
)
order by real_score desc;
