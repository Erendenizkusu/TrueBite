import { z } from "zod";

/**
 * Kontrollü sözlük — AI yalnızca bu sabit etiketlerden seçer. UI'da tutarlı ikon/filtre
 * sağlar ve etiket patlamasını önler (serbest metin yerine enum).
 */
export const HIGHLIGHT_TAGS = [
  "Temiz",
  "Lezzetli",
  "Hızlı Servis",
  "Güler Yüz",
  "Uygun Fiyat",
  "Keyifli Ambiyans",
  "Bol Porsiyon",
  "Taze Malzeme",
  "Merkezi Konum",
  "Kaliteli Kahve",
] as const;

export type HighlightTag = (typeof HIGHLIGHT_TAGS)[number];

/**
 * Maliyet güvenliği (altın kural): AI "öne çıkanlar" YALNIZCA listenin ilk N mekânı için
 * çekilebilir (her genişletme cache-miss'te 1 Google Place Details "reviews" + 1 AI çağrısı
 * doğurur). İlk 3 = kullanıcının en çok ilgileneceği mekânlar; alt sıralar için AI çağrısı yok.
 * Web (SpotRow) + mobil (SpotCard) bu sabiti paylaşır → tek yerden ayarlanır.
 */
export const HIGHLIGHTS_MAX_RANK = 3;

/** Claude structured output şeması — model en fazla 4 etiketi listeden seçer. */
export const highlightsSchema = z.object({
  features: z.array(z.enum(HIGHLIGHT_TAGS)).max(4),
});

export type Highlights = z.infer<typeof highlightsSchema>;

/** API yanıtı. */
export interface HighlightsResult {
  placeId: string;
  tags: HighlightTag[];
  cached: boolean;
  sourceReviewCount: number;
}
