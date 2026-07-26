import type { MetadataRoute } from "next";
import { allGuideCombos, guidePath } from "@/lib/guide";
import { localePath } from "@/lib/i18n";

const BASE = "https://volicious.app";

/**
 * Sitemap — arama motorlarına tüm sayfaları bildirir. FETCH YOK (yalnızca kayıt defteri
 * numaralandırılır) → oluşturması bedava, Google çağrısı doğurmaz. Rehber sayfaları
 * (şehir/kategori) buradan keşfedilir; ilk taramada üretilip cache'lenir.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages = [
    localePath("tr", "home"),
    localePath("en", "home"),
    localePath("tr", "about"),
    localePath("en", "about"),
    localePath("tr", "privacy"),
    localePath("en", "privacy"),
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.6,
  }));

  const guidePages = allGuideCombos().flatMap(({ city, categoryKey }) =>
    (["tr", "en"] as const).map((locale) => ({
      url: `${BASE}${guidePath(locale, city.slug, categoryKey)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  );

  return [...staticPages, ...guidePages];
}
