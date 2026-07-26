/**
 * Volicious — Şehir/kategori SEO rehber sayfaları: kayıt defteri + çözümleyiciler.
 *
 * Bu sayfalar ana "keşfet" (konum-öncelikli) ekranından AYRI, ikincil bir yüzeydir:
 * konum gerektirmeden, sabit şehir merkezine 1 kez (cache'li) istek atıp şehir çapında
 * en iyileri gösterir. Botun/ziyaretçinin konum vermeden gördüğü dolu içerik budur
 * (AdSense "yayıncı içeriği" kriteri + SEO). Ağır iş yine DB'de (nearby_places), veri
 * yine cache_cells (TTL) üzerinden — maliyet kaldıracı korunur.
 *
 * ⚠️ MALİYET GÜVENLİĞİ: rota, slug'ı bu beyaz-listeye karşı doğrular; geçersizse notFound()
 * → bot rastgele /şehir/kategori'ye vurup Google çağrısı tetikleyemez (altın kural).
 */

import { categoryByKey, type Locale, type Category } from "@truebite/shared";

export interface GuideCity {
  /** URL slug — ASCII, diakritiksiz, iki dilde aynı (istanbul, izmir…). */
  slug: string;
  /** Görünen ad (dile göre yazım: İzmir / Izmir). */
  name: { tr: string; en: string };
  /** Bulunma hâli — başlık/cümlelerde ("İstanbul'da" / "in Istanbul"). Türkçe ek
   *  morfolojisini elle yazıyoruz (İstanbul'da vs İzmir'de) → yanlış ek üretmeyiz. */
  locative: { tr: string; en: string };
  /** Şehir merkezi (sabit) — cache hücresi bundan türetilir, tüm ziyaretçiler paylaşır. */
  lat: number;
  lng: number;
  /** Şehir çekirdeği yarıçapı (m). "En iyi X" rehberi için merkez yoğunluğu yeterli. */
  radiusM: number;
  /** Bu şehrin sunduğu kategoriler (yalnızca zengin olacaklar → ince-içerik koruması). */
  categoryKeys: string[];
}

/** Büyük şehirler tüm kategorileri, orta şehirler yalnızca yoğun olanları sunar. */
const FULL = ["coffee", "doner", "pizza", "sushi", "burger", "seafood", "dessert"];
const CORE = ["coffee", "doner", "pizza", "burger", "dessert"];

export const CITIES: GuideCity[] = [
  {
    slug: "istanbul",
    name: { tr: "İstanbul", en: "Istanbul" },
    locative: { tr: "İstanbul'da", en: "in Istanbul" },
    lat: 41.0369,
    lng: 28.985,
    radiusM: 6000,
    categoryKeys: FULL,
  },
  {
    slug: "ankara",
    name: { tr: "Ankara", en: "Ankara" },
    locative: { tr: "Ankara'da", en: "in Ankara" },
    lat: 39.9208,
    lng: 32.8541,
    radiusM: 6000,
    categoryKeys: FULL,
  },
  {
    slug: "izmir",
    name: { tr: "İzmir", en: "Izmir" },
    locative: { tr: "İzmir'de", en: "in Izmir" },
    lat: 38.4237,
    lng: 27.1428,
    radiusM: 6000,
    categoryKeys: FULL,
  },
  {
    slug: "bursa",
    name: { tr: "Bursa", en: "Bursa" },
    locative: { tr: "Bursa'da", en: "in Bursa" },
    lat: 40.1885,
    lng: 29.061,
    radiusM: 5000,
    categoryKeys: CORE,
  },
  {
    slug: "antalya",
    name: { tr: "Antalya", en: "Antalya" },
    locative: { tr: "Antalya'da", en: "in Antalya" },
    lat: 36.8969,
    lng: 30.7133,
    radiusM: 6000,
    categoryKeys: CORE,
  },
  {
    slug: "adana",
    name: { tr: "Adana", en: "Adana" },
    locative: { tr: "Adana'da", en: "in Adana" },
    lat: 37.0,
    lng: 35.3213,
    radiusM: 5000,
    categoryKeys: CORE,
  },
  {
    slug: "eskisehir",
    name: { tr: "Eskişehir", en: "Eskişehir" },
    locative: { tr: "Eskişehir'de", en: "in Eskisehir" },
    lat: 39.7767,
    lng: 30.5206,
    radiusM: 4000,
    categoryKeys: CORE,
  },
];

/** Kategori URL slug'ları (dile göre). "all" rehber sayfalarında YOK — her sayfa tek kategori. */
const CATEGORY_SLUGS: Record<string, { tr: string; en: string }> = {
  coffee: { tr: "kahve", en: "coffee" },
  doner: { tr: "doner", en: "doner" },
  pizza: { tr: "pizza", en: "pizza" },
  sushi: { tr: "sushi", en: "sushi" },
  burger: { tr: "burger", en: "burger" },
  seafood: { tr: "balik", en: "seafood" },
  dessert: { tr: "tatli", en: "dessert" },
};

const CITY_BY_SLUG = new Map(CITIES.map((c) => [c.slug, c]));

/** Rehber kategori anahtarları (kayıt defterinde tanımlı olanlar). */
export const GUIDE_CATEGORY_KEYS = Object.keys(CATEGORY_SLUGS);

/** Slug'dan şehir (bilinmiyorsa undefined → rota notFound()). */
export function cityBySlug(slug: string): GuideCity | undefined {
  return CITY_BY_SLUG.get(slug);
}

/** Kategori anahtarından dile göre URL slug'ı. */
export function categorySlug(key: string, locale: Locale): string {
  return CATEGORY_SLUGS[key]?.[locale] ?? key;
}

/** URL slug'ından kategori anahtarı (o dildeki slug'a göre; bilinmiyorsa undefined). */
export function categoryKeyBySlug(slug: string, locale: Locale): string | undefined {
  for (const [key, s] of Object.entries(CATEGORY_SLUGS)) {
    if (s[locale] === slug) return key;
  }
  return undefined;
}

/** Kategori anahtarından Category nesnesi (etiket/CTA için). */
export function guideCategory(key: string): Category {
  return categoryByKey(key);
}

/** Bir şehrin bir kategoriyi sunup sunmadığı (ince-içerik + geçerlilik kapısı). */
export function cityHasCategory(city: GuideCity, key: string): boolean {
  return city.categoryKeys.includes(key);
}

/** Dile göre rehber yolu: /istanbul/kahve  |  /en/istanbul/coffee */
export function guidePath(locale: Locale, citySlug: string, categoryKey: string): string {
  const cat = categorySlug(categoryKey, locale);
  return locale === "tr" ? `/${citySlug}/${cat}` : `/en/${citySlug}/${cat}`;
}

/** Tüm geçerli (şehir, kategori) kombinasyonları — sitemap + iç bağlantılar için. */
export function allGuideCombos(): { city: GuideCity; categoryKey: string }[] {
  const out: { city: GuideCity; categoryKey: string }[] = [];
  for (const city of CITIES) {
    for (const key of city.categoryKeys) out.push({ city, categoryKey: key });
  }
  return out;
}

/**
 * Google formatlı adresten mahalle/ilçe çıkar (mesafe yerine gösterilir — konumsuz anlamlı).
 * Örn. "…, 34425 Beyoğlu/İstanbul" → "Beyoğlu". Bulunamazsa null (satır mahalleyi atlar).
 */
export function districtOf(address: string | null, cityNames: string[]): string | null {
  if (!address) return null;
  const last = address.split(",").pop()?.trim() ?? "";
  const beforeSlash = last.split("/")[0]?.trim() ?? "";
  const d = beforeSlash.replace(/^\d{4,6}\s*/, "").trim(); // baştaki posta kodunu at
  if (!d || d.length > 40) return null;
  const low = d.toLocaleLowerCase("tr");
  if (cityNames.some((n) => n.toLocaleLowerCase("tr") === low)) return null; // şehir adının kendisi
  return d;
}
