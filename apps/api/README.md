# @truebite/api

Volicious backend — **ince orkestrasyon + önbellek katmanı** (Fastify + TypeScript). Skorlama ve
geo filtre DAİMA DB'de (`nearby_places`); burada yalnızca akış yönetilir.

## Endpoint

```
GET /places/nearby?lat=40.99&lng=29.03&radiusM=2000&limit=50&type=cafe
GET /health
```

Girdi `nearbyQuerySchema` (zod, `@truebite/shared`) ile doğrulanır. Yanıt `NearbyResult`:
`{ query, cellId, radiusBucket, cacheHit, places: ScoredPlace[] }`.

## Cache hit/miss akışı

1. Konum geohash hücresine yuvarlanır (`cellId`) + yarıçap bucket'lanır.
2. `is_cell_fresh(cellId, bucket)` → **taze mi?**
3. **Evet:** doğrudan `nearby_places` (Google'a gidilmez) → `cacheHit: true`.
4. **Hayır:** Google Places (New) Nearby Search → `upsert_places` → `touch_cell` →
   `nearby_places` → `cacheHit: false`.

## Çalıştırma

```bash
cp .env.example .env          # supabase status değerleriyle doldur
npm start                     # node --env-file=.env src/server.ts
curl "http://localhost:8787/places/nearby?lat=40.99&lng=29.03&radiusM=2000"
```

> Google anahtarı olmadan cache-miss isteği 502 döner; cache-hit yolu (taze hücre) anahtarsız
> çalışır. Bağımlılıklar: `@supabase/supabase-js` (service_role), `fastify`, `@truebite/shared`.

## Test

```bash
npm test    # node --test "src/**/*.test.ts"
```

- `google.test.ts` — Google yanıt normalizasyonu (saf fonksiyon).
- `nearby.test.ts` — orkestrasyon akışı, sahte bağımlılıklarla (cache hit vs miss sırası).
