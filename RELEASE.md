# TrueBite — Release Yol Haritası

> Canlı checklist. Bir madde tamamlanınca `[x]` işaretle. Öncelik: 🔴 blocker, 🟡 launch-öncesi, 🟢 cila.
> Altın kural (bkz. CLAUDE.md → Monetizasyon): **maliyet ≤ gelir; reklamla denge.**

## 🔴 A — Para & Maliyet Güvenliği (altın kural; gerçek release-blocker)
- [x] **API bütçe koruması**: günlük/aylık Google Places bütçe sayacı (`usage_global` +
      `try_consume_budget`); cache-miss'te Google'a GİTMEDEN düşülür, tavan dolunca çağrı
      yapılmaz → bayat/DB verisi servis edilir (`budgetExceeded`). Tavan: `DAILY/MONTHLY_GOOGLE_BUDGET`.
- [x] **Kullanıcı-başı rate limit / kota**: `usage_user` + `consume_user_request` (atomik);
      cihaz-başına günlük ücretsiz istek (`FREE_REQUESTS_PER_DAY`). Aşılırsa **429** + `reason:watch_ad`.
      Kalan hak `X-Quota-Remaining` header'ında.
- [x] **Kullanıcı kimliği**: `X-Client-Id` başlığı (cihaz-id / anon uuid) → yoksa IP fallback.
- [x] **Backend tarafı**: rewarded ad → +istek: `grant_ad_request` + `POST /quota/grant`
      (`AD_GRANT_REQUESTS`). ⚠️ **Açık stub** — üretimde **AdMob SSV** ile korunmalı (aşağıda).
- [x] **İstemci kota UX'i (web + mobil)**: cihaz kimliği (X-Client-Id: web localStorage uuid,
      mobil bellek-uuid), kalan hak göstergesi ("bugün N keşif kaldı"), 429 → **LimitReached**
      ekranı ("Reklam izle → 1 keşif daha" + grant çağrısı). Web uçtan uca doğrulandı
      (429→grant→limit 2→3). Grant butonu şu an **STUB** — gerçek reklam yerine doğrudan
      `/quota/grant`. Mobil client-id EAS/native build'de kalıcılaştırılacak.
- [ ] **Gerçek reklam**: mobilde **AdMob rewarded ad SDK** (native build gerekir, Expo Go'da yok)
      + web'de display ad. Stub grant'ı gerçek ödül callback'iyle değiştir. **DEPLOY ÖNCESİ ŞART.**
- [ ] **AdMob SSV**: `/quota/grant` endpoint'ini sunucu-taraflı doğrulama ile koru (aksi halde
      curl ile bedava kota üretilir). Deploy (§B) sonrası, gerçek AdMob hesabıyla.
- [ ] (Büyüme) **Token** satın alma; fiyat = istek maliyeti + makul marj.

## 🔴 B — Dağıtım (şu an her şey localhost)
- [ ] **API deploy** (Railway/Render/Fly) → public URL.
- [ ] **Supabase cloud**: proje oluştur, migration'ları uygula, service key'i API'ye ver.
- [ ] **Web deploy** (Vercel); `API_BASE_URL` → prod API.
- [ ] **Mobil**: EAS build; `EXPO_PUBLIC_API_BASE_URL` → prod API; **Maps SDK key** → app.json.
- [ ] **APK/Store**: EAS `preview` profili (paylaşılabilir APK) → sonra App Store / Play Store.

## 🟡 C — Yasal / Uyumluluk (EU/Rotterdam)
- [ ] **Gizlilik politikası** (konum verisi!) + **kullanım şartları**; GDPR uyumu.
- [ ] Google Places ToS: **"Powered by Google"** atıfı. (30 gün cache ✅ zaten uyumlu.)
- [ ] App store: konum izni açıklaması + gizlilik beyanı.

## 🟡 D — Ürün Cilası
- [ ] **AI highlights**: kredi ekle & aktif et **veya** web'deki "yapay zekâmız özetledi" metnini yumuşat.
- [ ] Mobilde **boş/hata durumu UX'i** (web'de var, mobile taşı).
- [ ] **Hata izleme** (Sentry) + temel **analytics**.
- [ ] Onboarding + konum izni akışı.

## 🟢 E — Cila
- [ ] App icon, store görselleri, açıklama metni.
- [ ] (Opsiyonel) SEO şehir/kategori landing route'ları (web).

---
İlgili: CLAUDE.md (Monetizasyon & Maliyet Güvenliği), ARCHITECTURE.md, hafıza: monetization-cost-rule,
place-filtering-logic, project-status.
