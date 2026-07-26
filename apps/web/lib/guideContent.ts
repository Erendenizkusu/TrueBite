/**
 * Volicious — Rehber sayfası içerik üreticisi (iki dilli, şablonlu ama zengin).
 *
 * AdSense "yayıncı içeriği" ister → burada gerçek, okunur metin (giriş + SSS + bölüm
 * başlıkları) şehir/kategori verisiyle üretilir. CLAUDE.md ilkesi: FORMÜL/İÇ-MEKANİK
 * GÖSTERİLMEZ — yalnızca sezgi ve değer, müşteri-dostu dille. Türkçe ek morfolojisinden
 * kaçınmak için "bulunma hâli" (locative) kullanılır (İstanbul'da …), iyelik eki değil.
 */

import { categoryLabel, type Locale } from "@truebite/shared";
import { guideCategory, type GuideCity } from "./guide";

export interface GuideContent {
  breadcrumb: { home: string; city: string };
  eyebrow: string;
  h1: string;
  lede: string[];
  meta: { updated: string; evaluated: string; source: string };
  listHeading: string;
  listNote: string;
  callout: (topName: string) => { title: string; body: string };
  faq: { q: string; a: string }[];
  relatedTitle: string;
  relatedIntro: string;
  otherCategories: string;
  otherCities: string;
  bridge: { title: string; text: string; cta: string; secondary: string };
  footerNoteOtherLang: string;
}

interface Input {
  city: GuideCity;
  categoryKey: string;
  locale: Locale;
  /** Değerlendirilen aday sayısı (yaklaşık, "40+" biçiminde yuvarlanır). */
  evaluated: number;
  /** Zirvedeki mekan adı (varsa SSS'de anılır). */
  topName?: string;
  /** İnsan-okunur güncelleme tarihi (dile göre biçimli). */
  updatedLabel: string;
}

/** Değerlendirilen sayıyı alt-onluğa yuvarlayıp "+" ekler (24 → "20+", 8 → "birçok"). */
function approxCount(n: number, locale: Locale): string {
  if (n < 10) return locale === "tr" ? "onlarca" : "dozens of";
  const floored = Math.floor(n / 10) * 10;
  return `${floored}+`;
}

export function guideContent(input: Input): GuideContent {
  const { city, categoryKey, locale, evaluated, topName, updatedLabel } = input;
  const cat = guideCategory(categoryKey);
  const label = categoryLabel(cat, locale);
  const low = label.toLocaleLowerCase(locale === "tr" ? "tr" : "en");
  const cityName = city.name[locale];
  const loc = city.locative[locale];
  const approx = approxCount(evaluated, locale);

  if (locale === "tr") {
    return {
      breadcrumb: { home: "Ana Sayfa", city: cityName },
      eyebrow: `${cityName} · Şehir Rehberi`,
      h1: `${loc} Gerçekten En İyi ${label} Mekanları`,
      lede: [
        `${loc} en iyi ${low} nerede? Neredeyse her mekân 4,5 üzeri puanlarla dolu olduğundan, ` +
          `sadece yıldıza bakarak karar vermek zor. Volicious tam da bunu çözer: az sayıda yorumla ` +
          `şişmiş puanları ayıklar, binlerce gerçek deneyimle sınanmış mekânları öne çıkarır.`,
        `Aşağıdaki liste, ${loc.replace(/'d[ae]$/, "")} merkezindeki ${low} mekânlarını yorum sayısıyla ` +
          `dengelenmiş Volicious Puanı'na göre sıralar. Yeni açılmış, birkaç yorumla 5,0 almış bir yer; ` +
          `yıllardır binlerce yorumla 4,6 tutturan köklü bir mekânın önüne geçemez. Amacımız net: ` +
          `seni gerçekten iyi olana götürmek.`,
      ],
      meta: {
        updated: `Son güncelleme: ${updatedLabel}`,
        evaluated: `Değerlendirilen mekân: ${approx}`,
        source: "Kaynak: Google Yorumları",
      },
      listHeading: "Sıralama",
      listNote: "Volicious Puanı'na göre",
      callout: (name) => ({
        title: `Neden Google'da daha yüksek puanlı bazı yerler alt sıralarda?`,
        body:
          `Çünkü yüksek bir ortalama, yalnızca birkaç düzine yoruma dayanıyorsa istatistiksel olarak ` +
          `henüz kanıtlanmış sayılmaz. Binlerce yorumla 4,6 tutturan bir mekân, 40 yorumla 4,9 alan ` +
          `bir yerin önünde olabilir. ${name} gibi köklü mekânların üst sıralarda olması tesadüf değil — ` +
          `ölçülmüş dürüstlük tam olarak bu.`,
      }),
      faq: [
        {
          q: `${loc} en iyi ${low} mekânı hangisi?`,
          a:
            (topName
              ? `Şu anda en yüksek Volicious Puanı'na sahip mekân ${topName}. `
              : "") +
            `Sıralamamız bir mekânın puanını arkasındaki yorum sayısıyla dengeler; böylece az yorumla ` +
            `şişmiş yerler tepeye çıkamaz. Liste düzenli olarak güncellenir.`,
        },
        {
          q: "Volicious Puanı, Google puanından neden farklı?",
          a:
            "Google puanı ham bir ortalamadır — 5 yorumla 5,0 da, 5.000 yorumla 4,6 da aynı görünür. " +
            "Volicious Puanı bir mekânın puanını kaç yoruma dayandığıyla birlikte değerlendirir; " +
            "böylece az sayıda yorumla şişmiş yerler öne çıkamaz.",
        },
        {
          q: `${loc} kaç ${low} mekânı değerlendirdiniz?`,
          a:
            `${loc} merkezinde ${approx} mekânı değerlendirip yorum sayısına göre yeniden sıraladık. ` +
            `Listede yalnızca gerçekten öne çıkanları görürsün.`,
        },
        {
          q: "Yakınımdaki mekânları anlık nasıl bulurum?",
          a:
            "Volicious uygulamasını indir, konumunu paylaş; sana yürüme mesafendeki en iyileri aynı " +
            "mantıkla anlık sıralar. Bu sayfa ise şehir geneli bir rehberdir.",
        },
      ],
      relatedTitle: "Keşfetmeye devam et",
      relatedIntro:
        "Şehir rehberlerimiz — herhangi birine göz at, o şehrin en iyilerini konum vermeden gör.",
      otherCategories: `${loc} diğer kategoriler`,
      otherCities: `Diğer şehirlerde en iyi ${low}`,
      bridge: {
        title: "Yakınındakini gör",
        text: `Bu liste ${loc} şehir genelini kapsar. Ana ekranda konumunu paylaş, yürüme mesafendeki en iyileri anlık sıralayalım.`,
        cta: "Konumumdaki en iyileri gör",
        secondary: "Nasıl çalışır?",
      },
      footerNoteOtherLang: "",
    };
  }

  // ── EN ──
  return {
    breadcrumb: { home: "Home", city: cityName },
    eyebrow: `${cityName} · City Guide`,
    h1: `The Genuinely Best ${label} Spots ${loc}`,
    lede: [
      `Where is the best ${low} ${loc}? Since almost every spot is packed with 4.5-plus ratings, ` +
        `it's hard to decide on stars alone. That's exactly what Volicious fixes: it filters out ` +
        `ratings inflated by a handful of reviews and surfaces the spots proven by thousands of real experiences.`,
      `The list below ranks ${low} spots in the city core by a Volicious Score that balances the rating ` +
        `against how many reviews back it. A newly opened place with a 5.0 from a few reviews can't outrank a ` +
        `long-standing spot holding 4.6 across thousands. Our goal is simple: take you to what's genuinely good.`,
    ],
    meta: {
      updated: `Last updated: ${updatedLabel}`,
      evaluated: `Spots evaluated: ${approx}`,
      source: "Source: Google reviews",
    },
    listHeading: "Ranking",
    listNote: "by Volicious Score",
    callout: (name) => ({
      title: "Why are some higher-rated Google spots further down?",
      body:
        `Because a high average isn't statistically proven yet if it rests on just a few dozen reviews. ` +
        `A spot holding 4.6 across thousands can rank above one with a 4.9 from 40 reviews. It's no accident ` +
        `that well-established spots like ${name} sit near the top — that's measured honesty.`,
    }),
    faq: [
      {
        q: `What is the best ${low} spot ${loc}?`,
        a:
          (topName ? `Right now the highest Volicious Score belongs to ${topName}. ` : "") +
          `Our ranking balances a spot's rating against the number of reviews behind it, so places inflated ` +
          `by a few reviews can't reach the top. The list is updated regularly.`,
      },
      {
        q: "Why is the Volicious Score different from the Google rating?",
        a:
          "A Google rating is a raw average — a 5.0 from 5 reviews looks the same as a 4.6 from 5,000. " +
          "The Volicious Score weighs a rating by how many reviews back it, so places inflated by a handful " +
          "of reviews don't rise to the top.",
      },
      {
        q: `How many ${low} spots did you evaluate ${loc}?`,
        a:
          `We evaluated ${approx} spots in the city core and re-ranked them by review count. ` +
          `You only see the ones that genuinely stand out.`,
      },
      {
        q: "How do I find spots near me in real time?",
        a:
          "Download the Volicious app and share your location; it ranks the best spots within walking " +
          "distance using the same logic. This page is a city-wide guide.",
      },
    ],
    relatedTitle: "Keep exploring",
    relatedIntro:
      "Our city guides — open any one to see that city's best, no location required.",
    otherCategories: `Other categories ${loc}`,
    otherCities: `Best ${low} in other cities`,
    bridge: {
      title: "See what's near you",
      text: `This list covers ${cityName} city-wide. On the home screen, share your location and we'll rank the best spots within walking distance, live.`,
      cta: "See the best near me",
      secondary: "How it works",
    },
    footerNoteOtherLang: "",
  };
}
