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
