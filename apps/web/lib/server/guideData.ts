import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { categoryLabel, type Locale, type ScoredPlace } from "@truebite/shared";
import { runNearby } from "./backend";
import {
  cityBySlug,
  categoryKeyBySlug,
  cityHasCategory,
  guideCategory,
  guidePath,
  CITIES,
  type GuideCity,
} from "@/lib/guide";
import { guideContent, type GuideContent } from "@/lib/guideContent";
import { localePath } from "@/lib/i18n";
import type { GuideLink } from "@/components/guide/GuidePage";

/** Rehber sayfasında gösterilecek en fazla mekan. */
const MAX_ROWS = 30;
/** runNearby aday limiti (skorlanan havuz — "değerlendirilen" sayısı buradan). */
const CANDIDATE_LIMIT = 60;

/**
 * Şehir çapı nearby sonucu — CROSS-REQUEST cache (1 gün). Kök layout headers() kullandığı
 * için tüm site dynamic; bu katman olmadan her ziyaret (bot dâhil) bir Supabase DB sorgusu
 * doğururdu. Sonuç (şehir, kategori) başına 1 gün cache'lenir → çoğu ziyaret DB'ye de gitmez.
 * Google maliyeti zaten runNearby içindeki 10 günlük DB cache ile ayrıca sınırlı (altın kural).
 */
const nearbyForGuide = unstable_cache(
  (lat: number, lng: number, radiusM: number, category: string) =>
    runNearby({ lat, lng, radiusM, limit: CANDIDATE_LIMIT, category }),
  ["guide-nearby-v1"],
  { revalidate: 86400 },
);

export interface GuideData {
  city: GuideCity;
  categoryKey: string;
  places: ScoredPlace[];
  content: GuideContent;
  altHref: string;
  homeHref: string;
  aboutHref: string;
  ctaHref: string;
  otherCategories: GuideLink[];
  otherCities: GuideLink[];
  meta: {
    title: string;
    description: string;
    canonical: string;
    languages: { tr: string; en: string };
  };
}

/** Tarihi dile göre biçimler (ISR anında). Örn. "24 Tem 2026" / "24 Jul 2026". */
function updatedLabel(locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());
}

/**
 * Bir rehber sayfasının tüm verisini yükler. Slug geçersizse (bilinmeyen şehir/kategori ya da
 * o şehirde sunulmayan kategori) `null` döner → rota notFound() çağırır. Bu, botun rastgele
 * adrese vurup Google çağrısı tetiklemesini engeller (ALTIN KURAL kapısı).
 *
 * React cache() ile sarılı → aynı istekte generateMetadata + Page iki kez çağırsa da
 * runNearby (dolayısıyla olası Google çağrısı) YALNIZCA BİR KEZ çalışır.
 */
export const loadGuide = cache(async function loadGuide(
  locale: Locale,
  citySlug: string,
  categorySlug: string,
): Promise<GuideData | null> {
  const city = cityBySlug(citySlug);
  if (!city) return null;
  const categoryKey = categoryKeyBySlug(categorySlug, locale);
  if (!categoryKey || !cityHasCategory(city, categoryKey)) return null;

  // Sabit şehir merkezi → tek cache hücresi, tüm ziyaretçiler paylaşır. Cache + bütçe
  // kapısı runNearby içinde; üstüne 1 günlük cross-request cache (nearbyForGuide).
  const result = await nearbyForGuide(city.lat, city.lng, city.radiusM, categoryKey);

  const places = result.places.slice(0, MAX_ROWS);
  const content = guideContent({
    city,
    categoryKey,
    locale,
    evaluated: result.places.length,
    topName: places[0]?.name,
    updatedLabel: updatedLabel(locale),
  });

  const other: Locale = locale === "tr" ? "en" : "tr";
  const trPath = guidePath("tr", city.slug, categoryKey);
  const enPath = guidePath("en", city.slug, categoryKey);
  const canonical = guidePath(locale, city.slug, categoryKey);
  const altPath = guidePath(other, city.slug, categoryKey);

  const otherCategories: GuideLink[] = city.categoryKeys
    .filter((k) => k !== categoryKey)
    .map((k) => ({
      label: categoryLabel(guideCategory(k), locale),
      href: guidePath(locale, city.slug, k),
    }));

  const otherCities: GuideLink[] = CITIES.filter(
    (c) => c.slug !== city.slug && cityHasCategory(c, categoryKey),
  ).map((c) => ({ label: c.name[locale], href: guidePath(locale, c.slug, categoryKey) }));

  return {
    city,
    categoryKey,
    places,
    content,
    altHref: altPath,
    homeHref: localePath(locale, "home"),
    aboutHref: localePath(locale, "about"),
    ctaHref: localePath(locale, "home"),
    otherCategories,
    otherCities,
    meta: {
      title: `${content.h1} — Volicious`,
      description: content.lede[0]!.slice(0, 155),
      canonical,
      languages: { tr: trPath, en: enPath },
    },
  };
});
