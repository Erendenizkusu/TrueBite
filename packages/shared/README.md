# @truebite/shared

Volicious'ın **paylaşılan sözleşme katmanı**: web, mobil ve backend'in ortak kullandığı tipler,
zod şemaları ve önbellek grid anahtarı.

## İçerik

| Modül | Rol |
|-------|-----|
| `geohash.ts` | `encodeGeohash` / `cellId` / `radiusBucket` — önbellek anahtarı (saf TS, sıfır bağımlılık) |
| `schema.ts` | zod şemaları + `z.infer` tipleri: `NearbyQuery`, `Place`, `ScoredPlace`, `NearbyResult` |

## Neden geohash?

Önbellek anahtarı **ham lat/lng değildir** — her sorgu benzersiz koordinat olur ve önbellek hiç
tutmaz. Konum bir geohash hücresine yuvarlanır; `cellId` + `radiusBucket`, Supabase
`cache_cells` tablosunun birincil anahtarıyla (`cell_id`, `radius_bucket`) birebir eşleşir. DB
hiçbir grid eklentisine bağımlı olmaz — hesap burada yapılır.

## Neden zod?

zod, runtime doğrulamanın **tek kaynağıdır**; TS tipleri `z.infer` ile türetilir (drift olmaz).
İstemciden gelen güvenilmez girdiler (HTTP query parametreleri) bu şemalarla parse edilir;
sayılar string'den coerce edilir, varsayılanlar ve sınırlar burada uygulanır.

## Test

```bash
npm test                  # tüm testler (zod gerektirir): node --test "src/**/*.test.ts"
npm run test:geohash      # yalnız geohash (sıfır kurulum)
```

## Durum

✅ 13/13 test geçiyor (6 geohash + 7 zod). geohash, Wikipedia referans değeriyle (`u4pruydqqvj`)
doğrulandı; zod doğrulaması uçtan uca test edildi.
