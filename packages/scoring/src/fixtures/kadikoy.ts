/**
 * Ortak GOLDEN veri — Kadıköy demo bölgesi.
 *
 * Bu kümeyi hem TS testi (realScore.test.ts) hem de SQL kabul testi
 * (supabase/seed.sql + nearby_places) kullanır. Beklenen RealScore değerleri, iki
 * implementasyonun da üretmesi gereken SÖZLEŞMEdir. Değerler değişirse drift var demektir.
 *
 * Bölge istatistiği: C ≈ 4.27, m ≈ 1381.7 (10 mekanın tamamı puanlı).
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

/** Beklenen RealScore (3 ondalık) — SQL ile eşleşmeli. */
export const KADIKOY_EXPECTED: Record<string, number> = {
  demo_koklu: 4.522,
  demo_kahveci: 4.445,
  demo_pahali: 4.34,
  demo_pide: 4.338,
  demo_yeni: 4.275,
  demo_sisirilmis: 4.273,
  demo_sonuk: 4.165,
  demo_turist: 4.151,
  demo_esnaf: 4.134,
  demo_zincir: 3.745,
};

/** Beklenen sıralama (RealScore azalan). */
export const KADIKOY_EXPECTED_ORDER: string[] = [
  "demo_koklu",
  "demo_kahveci",
  "demo_pahali",
  "demo_pide",
  "demo_yeni",
  "demo_sisirilmis",
  "demo_sonuk",
  "demo_turist",
  "demo_esnaf",
  "demo_zincir",
];
