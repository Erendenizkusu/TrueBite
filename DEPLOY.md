# TrueBite — Deploy Runbook (§B)

> Topoloji (Vercel-only): **web + backend tek Next.js uygulaması** (Vercel serverless route'lar),
> **Supabase cloud** (DB), Google/Anthropic anahtarları Vercel env'de. Ayrı API host'u YOK.
> Backend mantığı tek kaynak: `packages/core` (hem yerel Fastify hem Vercel route'ları oradan beslenir).

```
Tarayıcı / Mobil
      │  GET /api/nearby, POST /api/quota/grant, GET /api/places/:id/highlights
      ▼
Vercel (apps/web — Next.js)         @truebite/core (nearby/kota/bütçe/AI)
      │
      ▼
Supabase cloud (PostGIS + RealScore RPC + usage/bütçe RPC)
      │
      ▼
Google Places API  (+ ileride Anthropic)
```

---

## 1) Supabase cloud

1. https://supabase.com → **New project** (bölge: EU — Frankfurt/Amsterdam, Rotterdam'a yakın).
   Güçlü bir DB şifresi belirle (kaydet).
2. Proje açılınca **Project Settings → API**'den şunları al:
   - `Project URL`  → Vercel'de `SUPABASE_URL`
   - `service_role` secret → Vercel'de `SUPABASE_SERVICE_ROLE_KEY` (⚠️ gizli, asla client'a verme)
3. Yerelden migration'ları buluta uygula (repo kökünde):
   ```bash
   supabase link --project-ref <PROJECT_REF>     # dashboard URL'indeki ref
   supabase db push                               # supabase/migrations/* buluta uygulanır
   ```
   `db push` tüm migration'ları (postgis, places, cache_cells, nearby_places v1-v4,
   api_rpcs, grants, place_highlights, **usage_cost_safety**) sırayla uygular.
4. (Opsiyonel) demo seed: cloud'da seed yok — ilk gerçek aramalar cache'i dolduracak.

## 2) Vercel (web + backend)

Vercel → **Add New → Project → GitHub → Erendenizkusu/TrueBite**.

**Ayarlar:**
- **Root Directory:** `apps/web`  (Turborepo otomatik algılanır; install repo kökünden yapılır)
- **Framework Preset:** Next.js (otomatik)
- **Build/Install Command:** varsayılan (elleme)

**Environment Variables** (Production + Preview ikisine de):

| Anahtar | Değer | Not |
|---|---|---|
| `SUPABASE_URL` | Supabase Project URL | zorunlu |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role secret | zorunlu, gizli |
| `GOOGLE_PLACES_API_KEY` | Google Places (New) anahtarı | cache-miss için zorunlu |
| `ANTHROPIC_API_KEY` | (opsiyonel) | highlights için; şimdilik boş bırakılabilir |
| `FREE_REQUESTS_PER_DAY` | `2` | maliyet güvenliği |
| `AD_GRANT_REQUESTS` | `1` | reklam başı +istek |
| `DAILY_GOOGLE_BUDGET` | `300` | günlük Google çağrı tavanı (trafik/bütçeye göre ayarla) |
| `MONTHLY_GOOGLE_BUDGET` | `5000` | aylık tavan |
| `CELL_PRECISION` | `6` | önbellek hücre çözünürlüğü |

Deploy sonrası prod URL: `https://<proje>.vercel.app`. Test:
`https://<proje>.vercel.app/api/nearby?lat=51.9225&lng=4.47917&radiusM=4000&category=coffee`

> Google Places anahtarını **API kısıtla**: yalnızca "Places API (New)"; HTTP referrer yerine
> sunucu kullanımı olduğundan IP/uygulama kısıtı yerine API kısıtı yeterli. Bütçe alarmı kur.

## 3) Mobil (Expo/EAS)

- `apps/mobile/.env`: `EXPO_PUBLIC_API_BASE_URL=https://<proje>.vercel.app`
  (yollar tekil: mobil `lib/api.ts` zaten `${BASE}/api/nearby` + `${BASE}/api/quota/grant` çağırıyor;
  yerel Fastify de aynı `/api/*` yollarını sunuyor → sadece BASE URL değişir.)
- Maps SDK anahtarı → `app.json` (Android/iOS).
- `eas build -p android --profile preview` → paylaşılabilir APK.
- Rewarded ad (AdMob) native build gerektirir → Expo Go'da çalışmaz.

## 4) Deploy sonrası maliyet güvenliği (§A kalanı)

- `/api/quota/grant` şu an **açık stub** → gerçek AdMob SSV ile koru (curl ile bedava kota engeli).
- Google Cloud Console'da **günlük bütçe alarmı** + `DAILY_GOOGLE_BUDGET`'i gerçek trafiğe göre kalibre et.

İlgili: `RELEASE.md` (checklist), `CLAUDE.md` (Monetizasyon altın kuralı), `ARCHITECTURE.md`.
