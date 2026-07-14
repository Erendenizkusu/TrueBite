// Biçimlendirme + güven etiketleri tek kaynakta yaşar: @truebite/shared (mobil ile birebir
// aynı olmak zorunda). Burada yalnızca yeniden-export + web'e özgü `correction`.
import type { ScoredPlace } from "@truebite/shared";

export { fmtDistance, fmtReviews, trustLabel, trustChip } from "@truebite/shared";
export type { Tone } from "@truebite/shared";

/** RealScore ile ham Google puanı arasındaki düzeltme. Negatif = aşağı çekildi
 *  (şişirilmiş puan eleniyor) — ürünün değer önermesi. */
export function correction(p: ScoredPlace): number | null {
  if (p.rating == null) return null;
  return p.realScore - p.rating;
}
