# @truebite/scoring

Volicious **RealScore** — Bayesyen ağırlıklı puanın TypeScript implementasyonu. SQL fonksiyonu
`public.nearby_places` ile **birebir aynı matematiğin ikizi**; UI'da anlık skor gösterimi,
testler ve istemci tarafı hesap için kullanılır.

```
RealScore = (v * R + m * C) / (v + m)
```

- `R` ham puan · `v` yorum sayısı · `C` bölge ortalama puanı · `m` bölge ortalama yorum sayısı

## API

```ts
import { computeRegionStats, realScore, rankByRealScore } from "@truebite/scoring";

const stats = computeRegionStats(places);          // { cMean: C, mConf: m }
const score = realScore(place, stats);             // tek mekan
const ranked = rankByRealScore(places);            // RealScore'a göre sıralı liste
```

**Sözleşme:** İstatistik (C, m) tüm bölge üzerinden ve tür filtresinden ÖNCE hesaplanır
(SQL ile aynı kalibrasyon davranışı). Tür filtresi sıralama sonrası uygulanır.

## Test (sıfır kurulum)

Node 24+ yerel TypeScript desteği sayesinde `npm install` GEREKMEZ:

```bash
npm test            # node --test src/realScore.test.ts
```

`src/fixtures/kadikoy.ts` ortak **golden** veridir: buradaki beklenen RealScore değerleri hem
bu testlerin hem de SQL kabul testinin (`supabase/seed.sql`) sözleşmesidir. İki taraf da aynı
değerleri üretmezse **drift** var demektir.

## Durum

✅ 7/7 test geçiyor. Golden değerler elle ve `nearby_places` matematiğiyle doğrulandı.
