# TrueBite — Mimari & Teknik Vizyon

> **Motto:** _"No fake reviews, just the best spots."_
> Zaman kaybettirmeyen, dürüst ve nokta atışı mekan listeleme.

Bu doküman projenin **tek doğruluk kaynağıdır (single source of truth)**. Mimari kararlar,
algoritma mantığı ve kısıtlar burada yaşar.

---

## 1. Vizyon & Çözülen Problem

TrueBite; kullanıcının bulunduğu konuma en yakın, en popüler ve **gerçek anlamda** en yüksek
puanlı restoranları listeler.

**Çözülen büyük problem:** Google Haritalar gibi platformlardaki **düz aritmetik ortalama**
sorunu. 5 yorumla 5.0 puan almış şişirilmiş/yeni mekanlar, 4500 yorumla 4.6 almış köklü ve
harika mekanların önüne geçiyor. TrueBite bu çarpıklığı düzeltir.

**Çözüm:** Yorum sayısı ile ham puanı oranlayan, manipülasyonu ve az-yorumlu yüksek puanları
eleyen **dinamik bir Bayesyen puanlama algoritması (RealScore)**.

---

## 2. Marka & Motto

- **İsim:** TrueBite — _"True"_ (dürüst/gerçek) + _"Bite"_ (lokma/yemek). Mottoyla birebir
  örtüşür ve trademark açısından ayırt edicidir.
- **Motto:** "No fake reviews, just the best spots."

---

## 3. Tech Stack (Kilitlenen Kararlar)

| Alan | Karar | Gerekçe |
|------|-------|---------|
| **Marka** | TrueBite | Mottoyla birebir; ayırt edici |
| **Mobil** | React Native (Expo) | Web (Next.js) ile aynı dil/tip paylaşımı, tek yetenek havuzu |
| **Backend** | Node.js (TypeScript) | Uçtan uca tek dil; Supabase JS SDK birinci sınıf |
| **Web** | Next.js + Tailwind CSS + TanStack Query | SEO/SSR odaklı; organik trafik → app indirme köprüsü |
| **Veritabanı** | Supabase (PostgreSQL) + **PostGIS** | Geo-radius sorguları DB seviyesinde |
| **Veri kaynağı** | Google Places API (New) + agresif cache | Maliyet kontrolü |

**Stratejik kazanım:** Tüm stack TypeScript olduğundan tip, şema ve iş mantığı (skor formülü
dahil) tek yerde yazılıp web + mobil + backend arasında paylaşılabilir.

---

## 4. Monorepo Yapısı (Turborepo)

```
truebite/
├── apps/
│   ├── web/          # Next.js (SSR/SEO, TanStack Query, Tailwind)
│   ├── mobile/       # React Native (Expo)
│   └── api/          # Node.js (TypeScript) backend — ince orkestrasyon + cache katmanı
├── packages/
│   ├── shared/       # Ortak TS tipleri, zod şemaları, API client
│   ├── scoring/      # Bayesyen skor formülü (tek yerde; UI gösterimi için de paylaşılır)
│   └── config/       # tsconfig, eslint, ortak ayarlar
└── supabase/
    ├── migrations/   # PostGIS + tablo şemaları + SQL fonksiyonları
    └── functions/    # (gerekirse) Edge Functions
```

**Mimari ilke:** Backend **ince bir orkestrasyon + cache katmanıdır**, ağır hesaplama katmanı
değil. Geo-radius filtreleme **ve** Bayesyen skorlama **PostgreSQL içinde** (PostGIS + SQL
fonksiyonu / materialized view) verinin yanında çalışır. Satırları app katmanına çekip döngüyle
hesaplamak yanlıştır. Bu, stack'teki **en kritik performans/maliyet kararıdır.**

---

## 5. Çekirdek Algoritma — Bayesyen Ortalama (RealScore)

IMDb/Amazon tarzı ağırlıklı puan:

```
RealScore = ( v / (v + m) ) * R  +  ( m / (v + m) ) * C
```

| Sembol | Anlam |
|--------|-------|
| `R` | Mekanın **ham ortalama puanı** (Google'dan gelen rating) |
| `v` | Mekanın **yorum sayısı** (user_ratings_total) |
| `C` | **Bölge ortalama puanı** — o sorgu yarıçapındaki tüm mekanların ortalaması (prior) |
| `m` | **Bölgenin ortalama yorum sayısı** — dinamik güven eşiği (prior ağırlığı) |

**Davranış:**
- `v` küçükken (az yorum) skor bölge ortalamasına (`C`) doğru çekilir → şişirilmiş 5.0'lar
  bastırılır.
- `v` büyüdükçe mekanın gerçek skoru (`R`) baskın hale gelir → köklü mekanlar yükselir.
- `m` ve `C` **her sorgu bölgesine göre dinamik** hesaplanır. Projenin asıl içgörüsü budur:
  eşik, bölgenin kendi yorum yoğunluğuna adapte olur.

**Tek formül kaynağı:** Mantık `packages/scoring` içinde yaşar; SQL tarafında eşdeğer bir
Postgres fonksiyonu uygulanır. İkisinin **drift etmemesi** test ile garanti altına alınır.

---

## 6. Veri Kaynağı & Önbellekleme (Caching) Mimarisi

Amaç: Google Places API (New) maliyetini agresif cache ile düşürmek.

**Cache anahtarı tasarımı:**
- Ham `lat/lng` **kullanılmaz** — her sorgu benzersiz koordinat olur ve cache hiç tutmaz.
- Bunun yerine bir **grid hücresi** (geohash veya H3) + bucket'lanmış yarıçap kullanılır.

**`places` tablosu (özet):** `place_id` (PK) · içerik alanları · `fetched_at` (zaman damgası).

**Sorgu akışı:**
1. Grid hücresi cache'te **taze mi?**
2. **Evet →** yalnızca PostGIS + SQL'den servis et (Google'a gidilmez).
3. **Hayır / bayat →** Google Places çağrısı → `upsert` → servis et.

**TTL:** 3 gün. **Maliyet koruması:** rate limit + günlük bütçe sayacı.

---

## 7. Mimari İlkeler & Kritik Uyarılar

1. **Google Places ToS uyumu (önemli):** Google Places API (New) şartları, çoğu yer
   *içeriğinin* (rating, yorum sayısı, isim) cache'lenmesini **maksimum 30 gün** ile sınırlar;
   yalnızca `place_id` süresiz saklanabilir. 3 günlük TTL **güvenli ✅**, ancak mimari
   **yenilemeye** dayalı olmalı — içeriği kalıcı veri ambarı gibi tutmamalı.
2. **DB-tarafı hesaplama:** Bayesyen skor + geo filtre Postgres'te çalışır; backend incedir.
3. **Tek formül kaynağı:** `packages/scoring` ↔ SQL fonksiyonu senkron; test ile doğrulanır.
4. **Conversion köprüsü:** Web SEO sayfaları (örn. "Kadıköy en iyi üçüncü nesil kahveciler")
   organik trafiği yakalar → app store + deferred deep linking ile uygulama indirmeye yönlendirir.

---

## 8. AI — "Öne Çıkan Özellikler" (Review Highlights)

Kullanıcı mekana tıkladığında, yorumlardan öne çıkan özellikleri etiket olarak gösterir
(örn. _Temiz · Personel Kibar · Lezzetli · Servis Hızlı_).

**Akış (caching ile maliyet ~sıfır):** Mekan detayı → `place_highlights` tablosunda taze kayıt
var mı? → **Varsa** DB'den servis (AI çağrısı yok). → **Yoksa** Google Details'tan gelen yorumları
(max 5) Claude'a gönder → yapılandırılmış JSON al → `place_highlights`'a upsert → servis.

**Model:** Claude **Haiku 4.5** (`claude-haiku-4-5`, $1/$5 per MTok) — yüksek hacimli, basit
çıkarım için ideal. Mekan başına ~$0.003; büyüme senaryosunda (~10K mekan/ay) ~$10-30/ay.

**Structured Output (enum):** Serbest metin değil, sabit bir **kontrollü sözlükten** seçtirilir
(`Temizlik`, `Lezzet`, `Servis Hızı`, `Personel`, `Fiyat/Performans`, `Ambiyans`, `Porsiyon`,
`Konum`). JSON şemasında `enum` ile zorlanır → tutarlı UI ikonları + filtreleme, etiket patlaması
olmaz. Şema `packages/shared`'da zod ile tanımlanır.

**`place_highlights` tablosu (öneri):** `place_id` (FK) · `tags` (jsonb, kontrollü sözlük) ·
`source_review_count` · `model` · `generated_at` (TTL, places yenilemesiyle hizalı).

**⚠️ ToS kısıtı:** Google Places (New) mekan başına **max 5 yorum** döndürür ve yorum metni
saklama kısıtlıdır. Ürettiğimiz etiketler (dönüştürülmüş, ham metni yeniden üretmeyen veri)
saklanabilir; ham yorum metni AI'a geçici gönderilir, kalıcı tutulmaz.

## 9. Açık Konular & Yol Haritası

- **Google fiyatlandırması (güncel teyit):** Google 2025'te $200 aylık krediyi kaldırıp SKU-başına
  ücretsiz kota modeline geçti; ihtiyacımız olan Enterprise+Atmosphere verisi pahalı katmanda.
  Maliyet projeksiyonu canlı fiyatla doğrulanmalı.
- **Fotoğraf maliyeti:** Place Photos ayrı/pahalı SKU; görüntü baytları ToS gereği cache'lenemez.
  Liste kartlarında foto yok / tek referans; detayda lazy-load.
- **Deep linking sağlayıcısı:** Branch.io vb. ile deferred deep linking netleştirilecek.
- **Skor parametre ayarı:** `m` için bölge ortalaması mı yoksa bir yüzdelik eşik mi kullanılacağı
  gerçek veriyle kalibre edilecek.

---

_Bu doküman canlı bir belgedir; mimari kararlar değiştikçe güncellenir._
