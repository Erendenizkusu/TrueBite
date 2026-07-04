# @truebite/web

Volicious web vitrini — **Next.js 15 (App Router) + Tailwind v4 + TanStack Query**. SEO/SSR
odaklı: organik trafiği yakalayıp mobil uygulamaya köprü kurar.

## Tasarım yönü — "Ölçülmüş dürüstlük"

AI-klişesi *cream + serif*'ten bilinçli kaçınılır. Temiz kağıt zemin + keskin grotesk
(**Hanken Grotesk**, Inter değil) + RealScore'un **monospace** ile gösterimi (ölçülmüş/hesaplanmış
hissi). İmza bileşen `RealScoreBadge`: ham Google puanının nasıl "düzeltildiğini" görünür kılar
(Şişirilmiş 5.0 → 4.27 `↓ düzeltildi`; Köklü 4.6 → 4.52 `≈ doğrulandı`).

- Palet: kağıt `#f4f2ec` · mürekkep `#15140f` · ember `#ff4a1c` · pine `#0f5c46`
- Tip: Hanken Grotesk (UI) + JetBrains Mono (skor/veri)

## Mimari

- `app/page.tsx` — RSC, sunucuda `/places/nearby`'ı çeker (SEO). Bölge `?n=slug` veya `?lat&lng`.
- `components/SpotsLive.tsx` — istemci, sunucu verisiyle hidrate; TanStack Query ile tazeler.
- `app/api/nearby/route.ts` — backend proxy'si (CORS'tan kaçınır).
- Veri tipleri `@truebite/shared`'dan (`NearbyResult`, `ScoredPlace`).

## Çalıştırma

```bash
cp .env.example .env.local        # API_BASE_URL=http://localhost:8787
# 1) backend ayakta olmalı: (apps/api) npm start
npm run dev                       # http://localhost:3000
```

> Şu an yalnızca **Kadıköy**'de seed verisi var; diğer bölgeler Google anahtarı bağlanınca
> dolacak. Backend kapalıysa UI zarif boş-durum gösterir.
