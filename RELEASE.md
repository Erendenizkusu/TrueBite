# TrueBite — Release Yol Haritası

> Canlı checklist. Bir madde tamamlanınca `[x]` işaretle. Öncelik: 🔴 blocker, 🟡 launch-öncesi, 🟢 cila.
> Altın kural (bkz. CLAUDE.md → Monetizasyon): **maliyet ≤ gelir; reklamla denge.**

## 🔴 A — Para & Maliyet Güvenliği (altın kural; gerçek release-blocker)
- [ ] **API bütçe koruması**: günlük/aylık Google Places bütçe sayacı; aşılırsa istek reddet/kuyrukla.
- [ ] **Kullanıcı-başı rate limit** (kötüye kullanım + maliyet patlaması koruması).
- [ ] **Kullanıcı kimliği**: anonim auth / device-id — kota + token takibinin temeli.
- [ ] **Günde 1-2 ücretsiz istek** kotası; bitince **rewarded ad** (AdMob) → +istek.
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
