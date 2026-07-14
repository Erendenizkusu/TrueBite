import Link from "next/link";
import type { Locale } from "@truebite/shared";
import { getDict, localePath } from "@/lib/i18n";

/**
 * "Hakkında" içerik sayfası (AdSense onayı + kullanıcı güveni).
 * Formül/iç-mekanik GÖSTERİLMEZ (web-homepage-direction) — yalnızca değer, müşteri-dostu dille.
 */
export function AboutPage({ locale }: { locale: Locale }) {
  const t = getDict(locale).about;

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
      <p className="mt-4 text-[15px] leading-relaxed text-stone">{t.intro}</p>

      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-ink/90">
        {t.sections.map((s) => (
          <section key={s.h}>
            <h2 className="font-display text-xl font-bold tracking-[-0.01em]">{s.h}</h2>
            <p className="mt-3 text-stone">{s.body}</p>
          </section>
        ))}

        <section>
          <h2 className="font-display text-xl font-bold tracking-[-0.01em]">{t.stepsHeading}</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-stone">
            {t.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      </div>

      <div className="mt-12 border-t border-line pt-6">
        <Link
          href={localePath(locale, "home")}
          className="inline-flex items-center gap-2 rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-paper transition hover:-translate-y-0.5"
        >
          {t.cta}
        </Link>
      </div>
    </main>
  );
}
