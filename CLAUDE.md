# TrueBite — Proje Talimatları (CLAUDE.md)

> Mottosu: **"No fake reviews, just the best spots."** Konuma en yakın, RealScore (Bayesyen
> ağırlıklı puan) ile sıralanmış **gerçekten** en iyi mekanları listeleyen mobil + web ürünü.
> Tam mimari: `ARCHITECTURE.md`.

## Monorepo (Turborepo / npm workspaces)

```
apps/
  api/      Node.js + Fastify backend — ince orkestrasyon + cache (skorlama DB'de)
  web/      Next.js 15 + Tailwind v4 + TanStack Query (SEO/SSR vitrin)
  mobile/   Expo + React Native + Expo Router (GPS-öncelikli)
packages/
  scoring/  RealScore TS implementasyonu (SQL ikizi)
  shared/   Ortak tipler, zod şemaları, geohash önbellek anahtarı, AI etiket sözlüğü
supabase/   PostGIS şema + RealScore SQL fonksiyonları + migration'lar
```

## Çekirdek ilkeler

- **Ağır iş DB'de:** geo filtre + RealScore daima PostgreSQL'de (`nearby_places`). Backend incedir.
- **Agresif cache:** Google Places verisi grid hücresi (geohash) + type ile önbelleğe alınır (3 gün TTL).
- **Tek doğruluk kaynağı:** RealScore mantığı `packages/scoring` + eşdeğer SQL; zod şemaları `packages/shared`.
- **Tasarım dili "Ölçülmüş dürüstlük":** AI-klişesi cream+serif YOK. Konum-bağımsız, konsept-öncelikli.
  Kullanıcıya formül/iç-mekanik gösterme. Detay: hafıza [[web-homepage-direction]].

## Geliştirme komutları

```bash
supabase start                      # yerel Supabase (Docker)
supabase db reset                   # şema + seed (veriyi sıfırlar) | migration up (veriyi korur)
cd apps/api  && npm start           # backend :8787 (--env-file=.env)
cd apps/web  && npm run dev         # web :3000
cd apps/mobile && npx expo start    # mobil
# Testler: ilgili paket/uygulamada `node --test ...` (Node yerel TS, sıfır kurulum)
```

## Sırlar

`apps/api/.env` (GOOGLE_PLACES_API_KEY, ANTHROPIC_API_KEY, SUPABASE_*) **asla commit'lenmez** —
`.gitignore` korur. `.env.example` yalnızca şablondur (boş anahtarlar).

## ⚙️ Oturum sonu / çıkış kuralı (ÖNEMLİ)

Kullanıcı oturumu bitirdiğini belirttiğinde ("bu kadar yeter", "şimdilik bu kadar", çıkış, vb.):

1. **Son güncellemeleri GitHub'a commit'le** (anlamlı, açıklayıcı mesajla).
2. **Proje yeni ise**, proje adıyla (örn. `TrueBite`) bir GitHub reposu oluştur ve **push'la**.
3. Var olan repoya, mevcut branch'e commit + push yap.
4. Sırlar (`.env`) asla push'lanmaz — `.gitignore` ile korunduğunu doğrula.
