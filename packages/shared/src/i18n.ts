import { HIGHLIGHT_TAGS, type HighlightTag } from "./highlights.ts";
import type { Category } from "./categories.ts";

/**
 * Volicious — paylaşılan dil katmanı (TEK DOĞRULUK KAYNAĞI).
 *
 * Burada YALNIZCA web + mobil arasında senkron kalması ZORUNLU olan metinler yaşar:
 * kategori adları, AI etiket adları ve sayı/mesafe biçimlendirme. Sayfaya özel metinler
 * (kahraman başlığı, hukuki sayfalar…) ilgili uygulamanın kendi sözlüğündedir.
 *
 * ⚠️ AI ETİKETLERİ: `HIGHLIGHT_TAGS` değerleri VERİTABANINDA saklanır (cache'li highlights).
 * Bu yüzden anahtarlar Türkçe kalır — çeviri yalnızca GÖSTERİM katmanındadır. Etiket
 * değerlerini değiştirmek tüm cache'i geçersiz kılar (ve yeniden AI maliyeti doğurur).
 */
export const LOCALES = ["tr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "tr";

/** Bilinmeyen/eksik girdiyi güvenle desteklenen bir dile indirger. */
export function normalizeLocale(input: string | null | undefined): Locale {
  const code = input?.toLowerCase().split(/[-_]/)[0];
  return LOCALES.includes(code as Locale) ? (code as Locale) : DEFAULT_LOCALE;
}

// ─────────────────────────────── Kategoriler ───────────────────────────────
// Kategorinin `key`'i kararlı kimliktir (API'ye giden); `label`/`ctaNoun` yalnızca TR
// gösterimdir. İngilizce karşılıklar burada, key üzerinden eşlenir.

interface CategoryText {
  label: string;
  /** CTA cümlesindeki isim: "List the top {ctaNoun} near me". */
  ctaNoun: string;
}

const CATEGORY_EN: Record<string, CategoryText> = {
  all: { label: "All", ctaNoun: "spots" },
  coffee: { label: "Coffee", ctaNoun: "coffee shops" },
  doner: { label: "Doner", ctaNoun: "doner places" },
  pizza: { label: "Pizza", ctaNoun: "pizza places" },
  sushi: { label: "Sushi", ctaNoun: "sushi restaurants" },
  burger: { label: "Burger", ctaNoun: "burger joints" },
  seafood: { label: "Seafood", ctaNoun: "seafood restaurants" },
  dessert: { label: "Dessert", ctaNoun: "dessert spots" },
};

/** Kategori çipinde/başlıkta görünen ad. */
export function categoryLabel(cat: Category, locale: Locale): string {
  return locale === "en" ? (CATEGORY_EN[cat.key]?.label ?? cat.label) : cat.label;
}

/** CTA cümlesindeki isim ("… en popüler {X} listele"). */
export function categoryCtaNoun(cat: Category, locale: Locale): string {
  return locale === "en" ? (CATEGORY_EN[cat.key]?.ctaNoun ?? cat.ctaNoun) : cat.ctaNoun;
}

// ─────────────────────────────── AI etiketleri ───────────────────────────────
// Anahtarlar (Türkçe) DB'de saklanır → DEĞİŞTİRME. Yalnızca gösterim çevrilir.

const HIGHLIGHT_EN: Record<HighlightTag, string> = {
  Temiz: "Clean",
  Lezzetli: "Tasty",
  "Hızlı Servis": "Fast Service",
  "Güler Yüz": "Friendly Staff",
  "Uygun Fiyat": "Good Value",
  "Keyifli Ambiyans": "Great Ambiance",
  "Bol Porsiyon": "Generous Portions",
  "Taze Malzeme": "Fresh Ingredients",
  "Merkezi Konum": "Central Location",
  "Kaliteli Kahve": "Quality Coffee",
};

/** AI etiketinin kullanıcıya gösterilecek adı. Bilinmeyen etiket olduğu gibi geçer. */
export function highlightLabel(tag: string, locale: Locale): string {
  if (locale !== "en") return tag;
  return HIGHLIGHT_EN[tag as HighlightTag] ?? tag;
}

/** Sözlüğün eksiksiz olduğunu tip düzeyinde garanti eder (yeni etiket eklenirse derleme kırılır). */
const _exhaustive: Record<(typeof HIGHLIGHT_TAGS)[number], string> = HIGHLIGHT_EN;
void _exhaustive;

// ─────────────────────────────── Biçimlendirme ───────────────────────────────

export function fmtDistance(m: number, _locale: Locale): string {
  if (m < 950) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

/** "1.2 B yorum" / "1.2k reviews" — binlik kısaltması dile göre değişir. */
export function fmtReviews(n: number, locale: Locale): string {
  const en = locale === "en";
  if (n >= 1000) {
    const b = (n / 1000).toFixed(1).replace(/\.0$/, "");
    return en ? `${b}k reviews` : `${b} B yorum`;
  }
  if (en) return `${n} ${n === 1 ? "review" : "reviews"}`;
  return `${n} yorum`;
}

export type Tone = "pine" | "stone" | "ember";

/** Yorum sayısına göre güven etiketi — RealScore'un "neden" hikayesi. */
export function trustLabel(reviews: number, locale: Locale): { label: string; tone: Tone } {
  const en = locale === "en";
  if (reviews >= 1000) return { label: en ? "established" : "köklü", tone: "pine" };
  if (reviews >= 300) return { label: en ? "trusted" : "güvenilir", tone: "pine" };
  if (reviews >= 50) return { label: en ? "fairly new" : "yeni sayılır", tone: "stone" };
  return { label: en ? "few reviews" : "az yorumlu", tone: "ember" };
}

/** RealScoreBadge'deki güven rozeti (çok yorumlu → güvenilir). */
export function trustChip(reviews: number, locale: Locale): string {
  const strong = reviews >= 300;
  if (locale === "en") return strong ? "✓ trusted" : "few reviews";
  return strong ? "✓ güvenilir" : "az yorumlu";
}
