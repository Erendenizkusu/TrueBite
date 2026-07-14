import Link from "next/link";
import type { Locale } from "@truebite/shared";
import { getDict, localePath } from "@/lib/i18n";

/**
 * Gizlilik Politikası — AdSense onayı + yasal uyum (KVKK/GDPR) için zorunlu.
 * Uygulamanın gerçekte yaptığını dürüstçe anlatır: konum → yakındaki mekan,
 * rastgele cihaz kimliği → adil kullanım kotası, reklam çerezleri.
 */
export function PrivacyPage({ locale }: { locale: Locale }) {
  const t = getDict(locale).privacy;

  return (
    <main className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
      <Link
        href={localePath(locale, "home")}
        className="font-mono text-xs uppercase tracking-[0.18em] text-sage hover:underline"
      >
        {t.back}
      </Link>

      <h1 className="mt-6 font-display text-3xl font-semibold tracking-[-0.01em] sm:text-4xl">
        {t.title}
      </h1>
      <p className="mt-2 font-mono text-xs text-stone">{t.updated}</p>

      <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-ink/90">
        <section>
          <p>{t.intro}</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold tracking-[-0.01em]">{t.dataHeading}</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-stone">
            {t.dataItems.map((item) => (
              <li key={item.k}>
                <strong className="text-ink">{item.k}</strong> {item.v}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-stone">{t.noAccount}</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold tracking-[-0.01em]">
            {t.thirdPartyHeading}
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-stone">
            {t.thirdPartyItems.map((item) => (
              <li key={item.k}>
                <strong className="text-ink">{item.k}</strong> {item.v}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold tracking-[-0.01em]">{t.cookiesHeading}</h2>
          <p className="mt-3 text-stone">{t.cookiesText}</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold tracking-[-0.01em]">{t.sharingHeading}</h2>
          <p className="mt-3 text-stone">{t.sharingText}</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold tracking-[-0.01em]">{t.rightsHeading}</h2>
          <p className="mt-3 text-stone">{t.rightsText}</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold tracking-[-0.01em]">{t.contactHeading}</h2>
          <p className="mt-3 text-stone">
            {t.contactText} <span className="text-ink">iletisim@volicious.app</span>
          </p>
        </section>
      </div>

      <div className="mt-12 border-t border-line pt-6">
        <Link
          href={localePath(locale, "home")}
          className="font-mono text-xs uppercase tracking-[0.18em] text-sage hover:underline"
        >
          {t.home}
        </Link>
      </div>
    </main>
  );
}
