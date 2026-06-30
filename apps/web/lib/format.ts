import type { ScoredPlace } from "@truebite/shared";

export type Tone = "pine" | "stone" | "ember";

/** Yorum sayısına göre güven etiketi — RealScore'un "neden" hikayesi. */
export function trustLabel(reviews: number): { label: string; tone: Tone } {
  if (reviews >= 1000) return { label: "köklü", tone: "pine" };
  if (reviews >= 300) return { label: "güvenilir", tone: "pine" };
  if (reviews >= 50) return { label: "yeni sayılır", tone: "stone" };
  return { label: "az yorumlu", tone: "ember" };
}

export function fmtDistance(m: number): string {
  if (m < 950) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export function fmtReviews(n: number): string {
  if (n >= 1000) {
    const b = (n / 1000).toFixed(1).replace(/\.0$/, "");
    return `${b} B yorum`;
  }
  return `${n} yorum`;
}

/** RealScore ile ham Google puanı arasındaki düzeltme. Negatif = aşağı çekildi
 *  (şişirilmiş puan eleniyor) — ürünün değer önermesi. */
export function correction(p: ScoredPlace): number | null {
  if (p.rating == null) return null;
  return p.realScore - p.rating;
}
