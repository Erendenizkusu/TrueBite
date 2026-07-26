import Link from "next/link";
import { categoryByKey, categoryLabel, type Locale } from "@truebite/shared";
import { getDict, localePath } from "@/lib/i18n";
import { CITIES, guidePath } from "@/lib/guide";
import { Mark } from "./Mark";

/** Footer'da gösterilecek temsili şehir+kategori rehberleri (çeşitlilik + alaka için elle seçildi).
 *  Buradan iç-çapraz linklerle (sayfadaki "diğer kategoriler/şehirler") kalan tüm sayfalara ulaşılır. */
const FOOTER_GUIDES: { citySlug: string; categoryKey: string }[] = [
  { citySlug: "istanbul", categoryKey: "coffee" },
  { citySlug: "ankara", categoryKey: "doner" },
  { citySlug: "izmir", categoryKey: "seafood" },
  { citySlug: "bursa", categoryKey: "doner" },
  { citySlug: "antalya", categoryKey: "seafood" },
  { citySlug: "adana", categoryKey: "doner" },
  { citySlug: "eskisehir", categoryKey: "coffee" },
];

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const cityBySlug = new Map(CITIES.map((c) => [c.slug, c]));

  return (
    <footer className="relative z-10 border-t border-line">
      {/* Şehir rehberleri — keşif ekranına dokunmadan iç-bağlantı + görünürlük (SEO). */}
      <div className="mx-auto max-w-5xl px-5 pt-12 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-stone">
          {locale === "tr" ? "Şehir Rehberleri" : "City Guides"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {FOOTER_GUIDES.map(({ citySlug, categoryKey }) => {
            const city = cityBySlug.get(citySlug);
            if (!city) return null;
            const label = `${city.name[locale]} · ${categoryLabel(categoryByKey(categoryKey), locale)}`;
            return (
              <Link
                key={`${citySlug}-${categoryKey}`}
                href={guidePath(locale, citySlug, categoryKey)}
                className="rounded-full border border-line bg-surface px-4 py-2 text-sm text-stone transition hover:border-sage/50 hover:text-sage-ink"
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-5xl flex-col gap-6 border-t border-line px-5 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <p className="flex items-center gap-2.5 text-lg font-extrabold uppercase leading-none tracking-[0.14em]">
            <Mark size={24} className="text-ink" />
            <span><span className="text-sage">V</span>OLICIOUS</span>
          </p>
          <p className="mt-1 font-mono text-sm text-stone">
            No fake reviews, just the best spots.
          </p>
          <div className="mt-3 flex gap-4 font-mono text-xs text-stone">
            <Link
              href={localePath(locale, "about")}
              className="underline-offset-2 hover:text-ink hover:underline"
            >
              {t.nav.about}
            </Link>
            <Link
              href={localePath(locale, "privacy")}
              className="underline-offset-2 hover:text-ink hover:underline"
            >
              {t.nav.privacy}
            </Link>
          </div>
        </div>
        <p className="max-w-xs text-xs leading-relaxed text-stone">{t.footer.disclaimer}</p>
      </div>
    </footer>
  );
}
