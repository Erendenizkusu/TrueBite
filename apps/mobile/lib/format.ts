// Biçimlendirme + güven etiketleri tek kaynakta yaşar: @truebite/shared (web ile birebir aynı
// olmak zorunda). Burada cihaz diline sabitlenmiş ince sarmalayıcılar sunulur — çağıran her
// yerde locale geçirmek zorunda kalmasın.
import {
  fmtDistance as fmtDistanceI18n,
  fmtReviews as fmtReviewsI18n,
  trustLabel as trustLabelI18n,
  trustChip as trustChipI18n,
  type Tone,
  type ScoredPlace,
} from "@truebite/shared";
import { locale } from "@/lib/i18n";

export type { Tone };

export const fmtDistance = (m: number): string => fmtDistanceI18n(m, locale);
export const fmtReviews = (n: number): string => fmtReviewsI18n(n, locale);
export const trustChip = (reviews: number): string => trustChipI18n(reviews, locale);
export const trustLabel = (reviews: number): { label: string; tone: Tone } =>
  trustLabelI18n(reviews, locale);

/** RealScore ile ham Google puanı arasındaki düzeltme (negatif = aşağı çekildi). */
export function correction(p: ScoredPlace): number | null {
  if (p.rating == null) return null;
  return p.realScore - p.rating;
}
