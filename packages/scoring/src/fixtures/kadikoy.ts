/**
 * Ortak GOLDEN veri — Kadıköy demo bölgesi.
 *
 * Bu kümeyi hem TS testi (realScore.test.ts) hem de SQL kabul testi
 * (supabase/seed.sql + nearby_places) kullanır. Beklenen RealScore değerleri, iki
 * implementasyonun da üretmesi gereken SÖZLEŞMEdir. Değerler değişirse drift var demektir.
 *
 * Bölge istatistiği (yorum-ağırlıklı C): C ≈ 4.227, m ≈ 1381.7 (10 mekanın tamamı puanlı).
 * Beklenen skorlar FinalScore = Bayesyen + güven terimi (β=0.25), [0,5] clamp.
 * NOT: bu demo veride yorum sayıları abartılı yüksek (4500, 3200…) olduğundan güven teriminin
 * ince-örnekli mekânlara verdiği − ceza büyük görünür (kadıköy sentetik); gerçek şehir verisinde
 * (m~300) ceza ılımlıdır. Fixture'ın amacı TS↔SQL PARİTESİ, gerçekçi büyüklük değil.
 */

import type { PlaceRating } from "../realScore.ts";

export interface DemoPlace extends PlaceRating {
  id: string;
  name: string;
}

export const KADIKOY_PLACES: DemoPlace[] = [
  { id: "demo_koklu", name: "Köklü Lokanta", rating: 4.6, userRatingsTotal: 4500 },
  { id: "demo_sisirilmis", name: "Şişirilmiş Kafe", rating: 5.0, userRatingsTotal: 5 },
  { id: "demo_yeni", name: "Yeni Açılan Burger", rating: 4.9, userRatingsTotal: 12 },
  { id: "demo_zincir", name: "Zincir Fast Food", rating: 3.4, userRatingsTotal: 2100 },
  { id: "demo_esnaf", name: "Ortalama Esnaf Lokantası", rating: 3.9, userRatingsTotal: 800 },
  { id: "demo_turist", name: "Turist Tuzağı", rating: 4.1, userRatingsTotal: 3200 },
  { id: "demo_kahveci", name: "Üçüncü Nesil Kahveci", rating: 4.7, userRatingsTotal: 950 },
  { id: "demo_pide", name: "Mahalle Pidecisi", rating: 4.4, userRatingsTotal: 1500 },
  { id: "demo_pahali", name: "Pahalı Restoran", rating: 4.5, userRatingsTotal: 600 },
  { id: "demo_sonuk", name: "Sönük Mekan", rating: 3.2, userRatingsTotal: 150 },
];

/** Beklenen FinalScore (3 ondalık) — SQL ile eşleşmeli. */
export const KADIKOY_EXPECTED: Record<string, number> = {
  demo_koklu: 4.641,
  demo_kahveci: 4.379,
  demo_pide: 4.326,
  demo_turist: 4.23,
  demo_pahali: 4.219,
  demo_esnaf: 4.048,
  demo_sonuk: 3.886,
  demo_zincir: 3.774,
  demo_yeni: 3.726,
  demo_sisirilmis: 3.639,
};

/** Beklenen sıralama (FinalScore azalan). */
export const KADIKOY_EXPECTED_ORDER: string[] = [
  "demo_koklu",
  "demo_kahveci",
  "demo_pide",
  "demo_turist",
  "demo_pahali",
  "demo_esnaf",
  "demo_sonuk",
  "demo_zincir",
  "demo_yeni",
  "demo_sisirilmis",
];
