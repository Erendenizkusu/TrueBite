/**
 * TrueBite — RealScore (Bayesyen ağırlıklı puan).
 *
 * Bu dosya, SQL fonksiyonu `public.nearby_places`
 * (supabase/migrations/20260630120300_nearby_places.sql) ile BİREBİR aynı matematiği
 * uygular. İkisi "drift" etmemelidir; ortak golden veri (fixtures/kadikoy.ts) her iki
 * tarafın da aynı sonucu ürettiğini garanti eden sözleşmedir.
 *
 *   FinalScore = (v * R + m * C) / (v + m)  +  β * ( log10(1+v) − log10(1+m) )
 *
 *   R = mekanın ham puanı (rating); yoksa C'ye çöker (SQL: coalesce(rating, c_mean))
 *   v = mekanın yorum sayısı (userRatingsTotal)
 *   C = bölge YORUM-AĞIRLIKLI ortalama puanı (cMean) — prior; Σ(R·v)/Σ(v)
 *   m = bölge ortalama yorum sayısı (mConf) — prior ağırlığı (dinamik güven eşiği)
 *   β = kanıtlanmışlık/güven ağırlığı (trustWeight) — bölgeye göreli hacim düzeltmesi
 *
 * İki kalibrasyon eklentisi (2026-07-02, gerçek-veri geri bildirimiyle):
 *   • C artık yorum-AĞIRLIKLI → az-yorumlu şişirilmiş 5.0'lar prior'ı kandıramaz.
 *   • Güven terimi: saf Bayesyen [R,C] aralığında sıkışıp bölge-altı-puanlı ama ÇOK yorumlu
 *     (kanıtlanmış) markaları asla öne taşıyamaz; bu terim tipik-üstü hacme +, ince-örnekliye
 *     − verir. Sonuç [0,5]'e sıkıştırılır (gösterim tutarlılığı). SQL v5 ile birebir.
 */

export interface PlaceRating {
  /** Ham ortalama puan R (0.0–5.0). Henüz puanı yoksa null. */
  rating: number | null;
  /** Yorum sayısı v. */
  userRatingsTotal: number;
}

export interface RegionStats {
  /** C — bölge ortalama puanı. */
  cMean: number;
  /** m — bölge ortalama yorum sayısı (güven eşiği). */
  mConf: number;
}

export interface RankedPlace<T> {
  place: T;
  realScore: number;
}

/** 3 ondalığa yuvarla — SQL'deki round(..., 3) ile eşleşir. */
export function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Kanıtlanmışlık/güven terimi varsayılan ağırlığı (β). SQL p_trust_weight default'u ile aynı. */
export const DEFAULT_TRUST_WEIGHT = 0.25;

/**
 * Bölge istatistiğini (C, m) hesaplar.
 *
 * SQL ile aynı kural: yalnızca PUANLANMIŞ mekanlar (userRatingsTotal > 0 ve rating != null)
 * üzerinden hesaplanır. Tür filtresinden ÖNCE, tüm operasyonel mekanlar verilmelidir;
 * böylece C bölgenin gerçek tabanını yansıtır (kalibrasyon içgörüsü).
 *
 * C YORUM-AĞIRLIKLI: Σ(rating·v)/Σ(v) (SQL: sum(rating*v)/sum(v)) — bir puan kaç kişiden
 * geldiyse o kadar ağırlık taşır → az-yorumlu şişirmeler prior'ı yukarı çekemez.
 * m düz ortalama kalır (prior "gücü" = tipik yorum sayısı, toplam hacim değil).
 */
export function computeRegionStats(places: ReadonlyArray<PlaceRating>): RegionStats {
  let sumRV = 0; // Σ(rating·v) — ağırlıklı puan toplamı
  let sumV = 0; // Σ(v)
  let n = 0;
  for (const p of places) {
    if (p.userRatingsTotal > 0 && p.rating !== null) {
      sumRV += p.rating * p.userRatingsTotal;
      sumV += p.userRatingsTotal;
      n += 1;
    }
  }
  if (n === 0 || sumV === 0) return { cMean: NaN, mConf: NaN };
  return { cMean: sumRV / sumV, mConf: sumV / n };
}

/**
 * Tek bir mekanın FinalScore'unu hesaplar (yuvarlanmamış, [0,5]'e sıkıştırılmış).
 *
 * @param trustWeight β — kanıtlanmışlık/güven terimi ağırlığı. 0 → saf Bayesyen RealScore.
 */
export function realScore(
  place: PlaceRating,
  stats: RegionStats,
  trustWeight: number = DEFAULT_TRUST_WEIGHT,
): number {
  const v = place.userRatingsTotal;
  const R = place.rating ?? stats.cMean; // SQL: coalesce(rating, c_mean)
  const C = stats.cMean;
  const m = stats.mConf;
  const denom = v + m;
  if (denom === 0) return NaN; // SQL: nullif(v + m, 0)
  const base = (v * R + m * C) / denom;
  // Güven terimi: bölgeye göreli hacim düzeltmesi (tipik-üstü + / ince-örnekli −).
  const trust = trustWeight * (Math.log10(1 + v) - Math.log10(1 + m));
  // [0,5] clamp — aşırı-hacimli popülerlerde skor 5'i aşmasın (SQL: least/greatest).
  return Math.min(5, Math.max(0, base + trust));
}

/**
 * Mekanları RealScore'a göre azalan sıralar.
 *
 * SQL `order by real_score desc nulls last, user_ratings_total desc` ile eşleşir:
 * skorlar 3 ondalığa yuvarlanmış değer üzerinden karşılaştırılır; NaN (puanlanabilir
 * mekan yok) en sona atılır; eşitlikte yorum sayısı fazla olan öne gelir.
 *
 * @param stats Verilmezse tüm girdi kümesinden hesaplanır. Tür filtresi uygulanacaksa
 *   istatistik TÜM bölge üzerinden hesaplanıp bu parametreyle geçilmeli, filtre sonra
 *   uygulanmalıdır (SQL davranışıyla uyum için).
 */
export function rankByRealScore<T extends PlaceRating>(
  places: ReadonlyArray<T>,
  stats?: RegionStats,
  trustWeight: number = DEFAULT_TRUST_WEIGHT,
): Array<RankedPlace<T>> {
  const s = stats ?? computeRegionStats(places);
  return places
    .map((place) => ({ place, realScore: round3(realScore(place, s, trustWeight)) }))
    .sort((a, b) => {
      const sa = Number.isNaN(a.realScore) ? -Infinity : a.realScore;
      const sb = Number.isNaN(b.realScore) ? -Infinity : b.realScore;
      return sb - sa || b.place.userRatingsTotal - a.place.userRatingsTotal;
    });
}
