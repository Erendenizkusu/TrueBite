/**
 * TrueBite — RealScore (Bayesyen ağırlıklı puan).
 *
 * Bu dosya, SQL fonksiyonu `public.nearby_places`
 * (supabase/migrations/20260630120300_nearby_places.sql) ile BİREBİR aynı matematiği
 * uygular. İkisi "drift" etmemelidir; ortak golden veri (fixtures/kadikoy.ts) her iki
 * tarafın da aynı sonucu ürettiğini garanti eden sözleşmedir.
 *
 *   RealScore = (v * R + m * C) / (v + m)
 *
 *   R = mekanın ham puanı (rating); yoksa C'ye çöker (SQL: coalesce(rating, c_mean))
 *   v = mekanın yorum sayısı (userRatingsTotal)
 *   C = bölge ortalama puanı (cMean)  — prior
 *   m = bölge ortalama yorum sayısı (mConf) — prior ağırlığı (dinamik güven eşiği)
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

/**
 * Bölge istatistiğini (C, m) hesaplar.
 *
 * SQL ile aynı kural: yalnızca PUANLANMIŞ mekanlar (userRatingsTotal > 0 ve rating != null)
 * üzerinden ortalama alınır. Tür filtresinden ÖNCE, tüm operasyonel mekanlar verilmelidir;
 * böylece C bölgenin gerçek tabanını yansıtır (kalibrasyon içgörüsü).
 */
export function computeRegionStats(places: ReadonlyArray<PlaceRating>): RegionStats {
  let sumR = 0;
  let sumV = 0;
  let n = 0;
  for (const p of places) {
    if (p.userRatingsTotal > 0 && p.rating !== null) {
      sumR += p.rating;
      sumV += p.userRatingsTotal;
      n += 1;
    }
  }
  if (n === 0) return { cMean: NaN, mConf: NaN };
  return { cMean: sumR / n, mConf: sumV / n };
}

/** Tek bir mekanın RealScore'unu hesaplar (yuvarlanmamış). */
export function realScore(place: PlaceRating, stats: RegionStats): number {
  const v = place.userRatingsTotal;
  const R = place.rating ?? stats.cMean; // SQL: coalesce(rating, c_mean)
  const C = stats.cMean;
  const m = stats.mConf;
  const denom = v + m;
  if (denom === 0) return NaN; // SQL: nullif(v + m, 0)
  return (v * R + m * C) / denom;
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
): Array<RankedPlace<T>> {
  const s = stats ?? computeRegionStats(places);
  return places
    .map((place) => ({ place, realScore: round3(realScore(place, s)) }))
    .sort((a, b) => {
      const sa = Number.isNaN(a.realScore) ? -Infinity : a.realScore;
      const sb = Number.isNaN(b.realScore) ? -Infinity : b.realScore;
      return sb - sa || b.place.userRatingsTotal - a.place.userRatingsTotal;
    });
}
