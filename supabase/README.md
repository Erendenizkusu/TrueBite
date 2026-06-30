# TrueBite — Supabase (DB Katmanı)

Mimari ilke gereği **ağır hesaplama burada, verinin yanında** çalışır: geo-radius filtresi
(PostGIS) **ve** Bayesyen RealScore tek bir SQL fonksiyonunda (`nearby_places`) hesaplanır.
Node backend yalnızca ince bir orkestrasyon + önbellek katmanıdır.

## Dizin

```
supabase/
├── migrations/
│   ├── 20260630120000_enable_postgis.sql   # postgis + moddatetime (extensions şeması)
│   ├── 20260630120100_places.sql           # places tablosu, GIST/GIN index, RLS, updated_at trigger
│   ├── 20260630120200_cache_cells.sql      # grid-hücresi önbellek izleme + is_cell_fresh()
│   └── 20260630120300_nearby_places.sql    # ÇEKİRDEK: yarıçap + RealScore tek sorguda
└── seed.sql                                # Kadıköy demo verisi (şişirilmiş 5.0 vs köklü 4.6)
```

## Çalıştırma (yerel)

Önkoşul: [Supabase CLI](https://supabase.com/docs/guides/cli) + Docker.

```bash
# proje kökünde, ilk kez:
supabase init          # supabase/config.toml üretir (bu repoda yok)

# DB'yi sıfırla: tüm migration'ları + seed.sql'i uygular
supabase db reset

# psql ile bağlan ve doğrula
supabase db reset && psql "$(supabase status -o env | grep DB_URL | cut -d= -f2-)"
```

Uzak (hosted) projeye uygulamak için: `supabase link --project-ref <ref>` ardından
`supabase db push`.

## Doğrulama (Acceptance Test)

Seed yüklendikten sonra:

```sql
select name, rating, user_ratings_total, real_score, distance_m
from public.nearby_places(40.9900, 29.0300, 2000);
```

**Beklenen sonuç** (RealScore'a göre azalan; bölge C≈4.27, m≈1382):

| # | name                  | rating | reviews | real_score |
|:-:|-----------------------|:------:|:-------:|:----------:|
| 1 | Köklü Lokanta         | 4.6    | 4500    | ~4.522 ✅  |
| 2 | Üçüncü Nesil Kahveci  | 4.7    | 950     | ~4.445     |
| 3 | Pahalı Restoran       | 4.5    | 600     | ~4.340     |
| 4 | Mahalle Pidecisi      | 4.4    | 1500    | ~4.338     |
| 5 | Yeni Açılan Burger    | 4.9    | 12      | ~4.275     |
| 6 | **Şişirilmiş Kafe**   | **5.0**| **5**   | **~4.273** ⬇️ |
| 7 | Sönük Mekan           | 3.2    | 150     | ~4.165     |
| 8 | Turist Tuzağı         | 4.1    | 3200    | ~4.151     |
| 9 | Ortalama Esnaf Lok.   | 3.9    | 800     | ~4.134     |
|10 | Zincir Fast Food      | 3.4    | 2100    | ~3.745     |

> **Kanıt:** Düz ortalamada #1 olması gereken "Şişirilmiş Kafe (5.0)", RealScore ile
> listenin ortasına düşer; "Köklü Lokanta (4.6, 4500 yorum)" #1 olur. Problem çözüldü.

Önbellek tazeliği:

```sql
select public.is_cell_fresh('sxk9...', 0);  -- grid hücresi 3 gün içinde dolduruldu mu?
```

## Kalibrasyon İçgörüsü (Önemli)

Bayesyen formül skoru **bölge ortalaması C'ye** doğru çeker. "4500 yorumlu 4.6"nın
"5 yorumlu 5.0"yı geçmesi, **C'nin bölgenin gerçek tabanını** (vasat mekanlar dahil)
yansıtmasına bağlıdır:

- C yalnızca **iyi** mekanların ortalaması olursa (örn. ~4.6), shrink zayıf kalır ve
  5.0/5 mekan hâlâ tepede görünebilir.
- Bu yüzden `nearby_places`, bölge istatistiğini **tür filtresinden önce** ve **tüm
  operasyonel mekanlar** üzerinden hesaplar → C gerçekçi (~4.27) olur.
- `m` (güven eşiği) ve `C`, gerçek veriyle kalibre edilecek iki ana parametredir. İleride
  `m` için sabit bir alt eşik (örn. bölge medyanı ya da bir yüzdelik) denenebilir.

## Notlar

- **Google ToS:** `places` içeriği yenilenebilir önbellektir (max 30 gün); TTL 3 gün.
  Yalnızca `place_id` süresiz saklanır.
- **RLS:** Tablolarda RLS açık, public politika yok → istemciler doğrudan erişemez. Backend
  `service_role` ile bağlanıp RLS'i bypass eder.
- **Grid:** `cell_id` (geohash/H3) uygulama katmanında (`packages/shared`) hesaplanır; DB
  herhangi bir grid eklentisine bağımlı değildir.
