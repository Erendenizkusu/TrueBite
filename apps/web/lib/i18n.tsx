import { DEFAULT_LOCALE, type Locale } from "@truebite/shared";

export type { Locale };
export { DEFAULT_LOCALE };

/**
 * Web sözlüğü. Kategori/AI-etiket/biçimlendirme metinleri BURADA DEĞİL — onlar
 * `@truebite/shared` içindedir (mobil ile senkron kalmak zorunda). Burada yalnızca
 * web'e özgü sayfa metinleri yaşar.
 *
 * URL stratejisi: kök = Türkçe (mevcut adresler korunur, SEO birikimi bozulmaz),
 * `/en` öneki = İngilizce. Bkz. `localePath()`.
 */
export interface Dict {
  htmlLang: string;
  meta: {
    title: string;
    description: string;
    ogDescription: string;
    aboutTitle: string;
    aboutDescription: string;
    privacyTitle: string;
    privacyDescription: string;
  };
  nav: {
    home: string;
    tagline: string;
    about: string;
    privacy: string;
    switchTo: string;
    switchLabel: string;
  };
  hero: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    sub: string;
    subStrong: string;
    cta: (noun: string) => string;
    ctaLoading: string;
    hint: string;
    motto: string;
    categoryTablist: string;
  };
  results: {
    headingAll: string;
    heading: (label: string) => string;
    quotaLeft: (n: number) => string;
    sorting: string;
    cached: string;
    fresh: string;
    highlightsLabel: string;
    highlightsError: string;
    highlightsEmpty: string;
    emptyTitle: string;
    emptyText: string;
    errorTitle: string;
    errorText: string;
    retry: string;
  };
  score: {
    label: string;
  };
  limit: {
    title: string;
    text: string;
    cta: string;
    ctaBusy: string;
    note: string;
  };
  location: {
    servicesTitle: string;
    servicesLead: string;
    permissionTitle: string;
    permissionLead: string;
    timeoutTitle: string;
    timeoutText: string;
    unsupportedTitle: string;
    unsupportedText: string;
    retry: string;
    toggleFromServices: string;
    toggleFromPermission: string;
    otherFromServices: string;
    otherFromPermission: string;
  };
  footer: {
    disclaimer: string;
  };
  about: {
    back: string;
    title: string;
    intro: React.ReactNode;
    sections: { h: string; body: React.ReactNode }[];
    steps: string[];
    stepsHeading: string;
    cta: string;
  };
  privacy: {
    back: string;
    title: string;
    updated: string;
    intro: string;
    dataHeading: string;
    dataItems: { k: string; v: string }[];
    noAccount: React.ReactNode;
    thirdPartyHeading: string;
    thirdPartyItems: { k: string; v: string }[];
    cookiesHeading: string;
    cookiesText: string;
    sharingHeading: string;
    sharingText: React.ReactNode;
    rightsHeading: string;
    rightsText: string;
    contactHeading: string;
    contactText: string;
    home: string;
  };
}

const tr: Dict = {
  htmlLang: "tr",
  meta: {
    title: "Volicious — Sahte yorum yok, sadece en iyi mekanlar",
    description:
      "Konumuna en yakın, gerçekten en iyi puanlı restoranlar. Az yorumlu şişirilmiş puanları eleyen RealScore algoritmasıyla — dürüst, nokta atışı keşif.",
    ogDescription:
      "Şişirilmiş 5.0'ları eleyen, köklü mekanları öne çıkaran RealScore'la gerçek keşif.",
    aboutTitle: "Hakkında — Volicious nasıl çalışır?",
    aboutDescription:
      "Volicious, sahte ve şişirilmiş puanları eleyip binlerce yorumu ağırlıklandırarak konumundaki gerçekten en iyi mekanları gösterir. Nasıl çalıştığını anlattık.",
    privacyTitle: "Gizlilik Politikası — Volicious",
    privacyDescription:
      "Volicious hangi verileri işler, neden işler ve hangi üçüncü taraflarla (Google Places, AdSense, AdMob) paylaşır — açık ve sade.",
  },
  nav: {
    home: "Volicious ana sayfa",
    tagline: "Gerçek puan, gerçek mekan",
    about: "Hakkında",
    privacy: "Gizlilik Politikası",
    switchTo: "English",
    switchLabel: "Switch to English",
  },
  hero: {
    eyebrow: "Dürüst mekan keşfi",
    titleLine1: "Gözlerini kapat!",
    titleLine2: "Seni harika bir yere götürüyorum.",
    sub: "Algoritmamız şişirilmiş ve sahte puanları ayıkladı, binlerce yorumu ağırlıklandırdı. Konumundaki en popüler ve dürüst mekanlar tek tıkla karşında.",
    subStrong: "Hadi tıkla da gidelim.",
    cta: (noun) => `Konumumdaki en popüler ${noun} listele`,
    ctaLoading: "Konumun bulunuyor…",
    hint: "Tek dokunuş. Konumundaki en iyileri RealScore'a göre sıralayalım — şişirilmiş puanlar elenir.",
    motto: "No fake reviews · just the best spots",
    categoryTablist: "Mekan kategorisi",
  },
  results: {
    headingAll: "En iyi mekanlar",
    heading: (label) => `En iyi ${label.toLowerCase()} mekanları`,
    quotaLeft: (n) => `bugün ${n} keşif kaldı`,
    sorting: "sıralanıyor…",
    cached: "● anlık",
    fresh: "● az önce güncellendi",
    highlightsLabel: "Yorumlardan öne çıkanlar",
    highlightsError: "Öne çıkanlar şu an yüklenemedi.",
    highlightsEmpty: "Bu mekân için henüz öne çıkan bir özellik derleyemedik.",
    emptyTitle: "bu kategoride yakınında mekan bulunamadı",
    emptyText: "Yarıçapı genişletmeyi ya da farklı bir kategori denemeyi dene.",
    errorTitle: "şu an listeye ulaşamadık",
    errorText: "Sunucuya bağlanırken bir sorun oldu. Birkaç saniye sonra tekrar dene.",
    retry: "Tekrar dene",
  },
  score: { label: "Volicious Puanı" },
  limit: {
    title: "Bugünlük ücretsiz keşif hakkın doldu",
    text: "Kaliteli mekan verisi bize maliyet doğurur; adil kullanım için günlük bir sınır var. Kısa bir reklam izleyerek bir keşif daha açabilir ya da yarın devam edebilirsin.",
    cta: "Reklam izle → 1 keşif daha",
    ctaBusy: "hazırlanıyor…",
    note: "Kota her gün sıfırlanır.",
  },
  location: {
    servicesTitle: "Cihazının konumu kapalı",
    servicesLead:
      "Cihazının konum servisi kapalı olduğu için çevrendeki mekanları bulamıyoruz. Açmak birkaç saniye sürer:",
    permissionTitle: "Konum izni verilmemiş",
    permissionLead: "Bu siteye konum izni verilmemiş. Tarayıcından izni açman yeterli:",
    timeoutTitle: "Konumuna ulaşamadık",
    timeoutText:
      "Sinyal zayıf olabilir ya da işlem zaman aşımına uğradı. Birkaç saniye sonra tekrar denemek genelde çözer.",
    unsupportedTitle: "Tarayıcın konum desteklemiyor",
    unsupportedText:
      "Bu tarayıcı konum paylaşımını desteklemiyor. Chrome, Edge, Safari ya da Firefox'un güncel bir sürümüyle tekrar dener misin?",
    retry: "Açtım, tekrar dene",
    toggleFromServices: "Konumum açık, yine de çalışmıyor",
    toggleFromPermission: "İzni verdim, yine de çalışmıyor",
    otherFromServices: "O zaman sorun tarayıcı izninde olabilir:",
    otherFromPermission: "O zaman cihazının konum servisi kapalı olabilir:",
  },
  footer: {
    disclaimer:
      "Veriler Google Places üzerinden alınır, Volicious RealScore (Bayesyen ağırlıklı puan) ile yeniden sıralanır. Puanlar yorum sayısına göre ağırlıklandırılır.",
  },
  about: {
    back: "← Volicious",
    title: "Sahte yorum yok, sadece en iyi mekanlar",
    intro: (
      <>
        Volicious, konumuna en yakın <strong className="text-ink">gerçekten</strong> en iyi mekanları
        bulmanı sağlayan bir keşif aracıdır. Bir tıkla, çevrendeki en popüler ve dürüst puanlı yerleri
        önüne getirir — reklam kokan listeler ya da şişirilmiş beş yıldızlar değil.
      </>
    ),
    sections: [
      {
        h: "Çözdüğümüz problem",
        body: (
          <>
            Çoğu harita uygulamasında puanlar <strong className="text-ink">düz ortalamadır</strong>.
            Bu yüzden daha yeni açılmış, topu topu 5 yorumla 5.0 almış bir mekan; yıllardır hizmet
            veren, 4.000 yorumla 4.6 almış köklü bir mekanın önüne geçebilir. Oysa hangisinin
            gerçekten iyi olduğunu ikinci mekanın binlerce deneyimi anlatır. Bu çarpıklık, yanlış
            yere gitmene yol açar.
          </>
        ),
      },
      {
        h: "Nasıl yardımcı oluyoruz",
        body: (
          <>
            Volicious, bir mekanın puanını{" "}
            <strong className="text-ink">yorum sayısına göre ağırlıklandırır</strong>. Az sayıda
            yoruma dayanan şişirilmiş puanlar temkinle değerlendirilir; binlerce gerçek deneyimle
            desteklenen puanlar öne çıkar. Böylece listenin tepesinde{" "}
            <strong className="text-ink">güvenebileceğin</strong> yerler kalır. Sana bir formül ya da
            karmaşık grafik göstermeyiz — sadece sonucu: nereye gitmen gerektiğini.
          </>
        ),
      },
      {
        h: "Yorumlardan öne çıkanlar",
        body: (
          <>
            Bir mekana dokunduğunda, gerçek yorumlardan derlenmiş kısa özet etiketleri görürsün
            (örneğin lezzet, temizlik, servis hızı, personel). Yüzlerce satır yorumu okumadan, bir
            yerin neyde iyi olduğunu saniyeler içinde anlarsın.
          </>
        ),
      },
    ],
    stepsHeading: "Nasıl kullanılır",
    steps: [
      "Ana sayfada bir kategori seç (örneğin kahve, döner, pizza).",
      "“Konumumdaki en popülerleri listele” butonuna dokun.",
      "Çevrendeki en iyi mekanlar, dürüst puanlarıyla sıralı karşında.",
    ],
    cta: "Hadi keşfe başla →",
  },
  privacy: {
    back: "← Volicious",
    title: "Gizlilik Politikası",
    updated: "Son güncelleme: 4 Temmuz 2026",
    intro:
      "Volicious (“biz”), konumuna en yakın gerçekten en iyi mekanları gösteren bir keşif hizmetidir. Amacımız az veriyle çok değer sunmak; topladığımız her veri, hizmetin çalışması için gereken en az veridir. Bu politika neyi neden işlediğimizi sade dille anlatır.",
    dataHeading: "İşlediğimiz veriler",
    dataItems: [
      {
        k: "Yaklaşık konum:",
        v: "Yakınındaki mekanları bulmak için tarayıcının/cihazın konumunu yalnızca sen “listele”ye bastığında alırız. Konum, mekan aramasını yapmak için kullanılır; kalıcı olarak profilinle eşleştirilmez.",
      },
      {
        k: "Rastgele cihaz kimliği:",
        v: "Adil kullanım / günlük ücretsiz keşif kotası için cihazında rastgele bir kimlik saklanır (tarayıcı deposu). Bu kimlik seni şahsen tanımlamaz; kimliğinle, adınla veya e-postanla ilişkilendirilmez.",
      },
      {
        k: "Teknik kayıtlar:",
        v: "Hizmeti güvenli ve çalışır tutmak için standart sunucu kayıtları (istek zamanı, hata bilgisi) geçici olarak tutulabilir.",
      },
    ],
    noAccount: (
      <>
        Hesap oluşturmuyoruz; ad, e-posta veya telefon{" "}
        <strong className="text-ink">toplamıyoruz</strong>.
      </>
    ),
    thirdPartyHeading: "Üçüncü taraf hizmetler",
    thirdPartyItems: [
      {
        k: "Google Places:",
        v: "Mekan bilgisi (isim, puan, yorum sayısı) Google Places API’den alınır. Aramayı yapmak için konumun bu servise iletilir.",
      },
      {
        k: "Google AdSense (web):",
        v: "Web sitesinde reklam göstermek için Google AdSense kullanılabilir. AdSense ve iş ortakları, ilgili reklamlar sunmak için çerezleri ve benzeri teknolojileri kullanabilir. Reklam kişiselleştirmesini Google Reklam Ayarları’ndan yönetebilirsin.",
      },
      {
        k: "Google AdMob (mobil):",
        v: "Mobil uygulamada ödüllü reklamlar AdMob ile sunulur; benzer reklam teknolojileri geçerlidir.",
      },
      {
        k: "OpenAI:",
        v: "Bir mekanın öne çıkan özelliklerini özetlemek için herkese açık yorum metinleri geçici olarak işlenir; bu işlemde kişisel verin gönderilmez.",
      },
    ],
    cookiesHeading: "Çerezler ve reklamlar",
    cookiesText:
      "Reklam sağlayıcıları (Google dâhil) reklamları sunmak ve ölçmek için çerez kullanabilir. Avrupa Ekonomik Alanı / Birleşik Krallık kullanıcıları için, gerektiğinde bir rıza yönetim mekanizması aracılığıyla onayın istenir. Tarayıcı ayarlarından çerezleri sınırlayabilirsin; bu durumda reklamlar daha az ilgili olabilir.",
    sharingHeading: "Paylaşım ve saklama",
    sharingText: (
      <>
        Verini <strong className="text-ink">satmayız</strong>. Yalnızca hizmeti sağlamak için gereken
        üçüncü taraflarla (yukarıdakiler) paylaşılır. Verileri, amacı için gereken süre kadar tutarız.
      </>
    ),
    rightsHeading: "Haklarınız",
    rightsText:
      "KVKK ve GDPR kapsamında verilerine erişme, düzeltme ve silinmesini talep etme haklarına sahipsin. Talebini aşağıdaki iletişim adresine iletebilirsin.",
    contactHeading: "İletişim",
    contactText: "Sorular için:",
    home: "← Ana sayfaya dön",
  },
};

const en: Dict = {
  htmlLang: "en",
  meta: {
    title: "Volicious — No fake reviews, just the best spots",
    description:
      "The genuinely best-rated restaurants near you. Powered by RealScore, which filters out inflated ratings built on a handful of reviews — honest, pinpoint discovery.",
    ogDescription:
      "Real discovery with RealScore: inflated 5.0s filtered out, well-established spots surfaced.",
    aboutTitle: "About — how Volicious works",
    aboutDescription:
      "Volicious filters out fake and inflated ratings and weighs thousands of reviews to surface the genuinely best spots near you. Here's how it works.",
    privacyTitle: "Privacy Policy — Volicious",
    privacyDescription:
      "What data Volicious processes, why, and which third parties (Google Places, AdSense, AdMob) it's shared with — clear and plain.",
  },
  nav: {
    home: "Volicious home",
    tagline: "Real ratings, real spots",
    about: "About",
    privacy: "Privacy Policy",
    switchTo: "Türkçe",
    switchLabel: "Türkçe'ye geç",
  },
  hero: {
    eyebrow: "Honest spot discovery",
    titleLine1: "Close your eyes!",
    titleLine2: "I'm taking you somewhere great.",
    sub: "Our algorithm filtered out inflated and fake ratings and weighed thousands of reviews. The most popular, honestly rated spots near you are one tap away.",
    subStrong: "Tap and let's go.",
    cta: (noun) => `List the top ${noun} near me`,
    ctaLoading: "Finding your location…",
    hint: "One tap. We'll rank the best spots near you by RealScore — inflated ratings get filtered out.",
    motto: "No fake reviews · just the best spots",
    categoryTablist: "Spot category",
  },
  results: {
    headingAll: "Best spots",
    heading: (label) => `Best ${label.toLowerCase()} spots`,
    quotaLeft: (n) => `${n} ${n === 1 ? "search" : "searches"} left today`,
    sorting: "ranking…",
    cached: "● instant",
    fresh: "● just updated",
    highlightsLabel: "Highlights from reviews",
    highlightsError: "Couldn't load highlights right now.",
    highlightsEmpty: "We couldn't compile any highlights for this spot yet.",
    emptyTitle: "no spots found nearby in this category",
    emptyText: "Try widening the radius or picking a different category.",
    errorTitle: "we couldn't reach the list",
    errorText: "Something went wrong connecting to the server. Try again in a few seconds.",
    retry: "Try again",
  },
  score: { label: "Volicious Score" },
  limit: {
    title: "You've used today's free searches",
    text: "Quality spot data costs us money, so there's a daily limit to keep things fair. Watch a short ad to unlock one more search, or come back tomorrow.",
    cta: "Watch an ad → 1 more search",
    ctaBusy: "getting ready…",
    note: "Your quota resets every day.",
  },
  location: {
    servicesTitle: "Your device's location is off",
    servicesLead:
      "Your device's location service is turned off, so we can't find spots around you. Turning it on takes a few seconds:",
    permissionTitle: "Location permission not granted",
    permissionLead: "This site doesn't have location permission. Just enable it in your browser:",
    timeoutTitle: "We couldn't get your location",
    timeoutText:
      "The signal may be weak, or the request timed out. Trying again in a few seconds usually fixes it.",
    unsupportedTitle: "Your browser doesn't support location",
    unsupportedText:
      "This browser doesn't support location sharing. Could you try again with a recent version of Chrome, Edge, Safari or Firefox?",
    retry: "I've enabled it, try again",
    toggleFromServices: "My location is on, it still doesn't work",
    toggleFromPermission: "I granted permission, it still doesn't work",
    otherFromServices: "Then the problem may be the browser permission:",
    otherFromPermission: "Then your device's location service may be off:",
  },
  footer: {
    disclaimer:
      "Data comes from Google Places and is re-ranked by Volicious RealScore (a Bayesian weighted rating). Ratings are weighted by review count.",
  },
  about: {
    back: "← Volicious",
    title: "No fake reviews, just the best spots",
    intro: (
      <>
        Volicious is a discovery tool that helps you find the <strong className="text-ink">genuinely</strong>{" "}
        best spots near you. One tap puts the most popular, honestly rated places around you in front
        of you — not ad-driven listings or inflated five stars.
      </>
    ),
    sections: [
      {
        h: "The problem we solve",
        body: (
          <>
            On most map apps, ratings are a <strong className="text-ink">plain average</strong>. That
            lets a newly opened spot with a 5.0 from all of 5 reviews outrank a long-standing place
            with a 4.6 from 4,000 reviews. Yet it's the second one's thousands of experiences that
            actually tell you which is good. That distortion sends you to the wrong place.
          </>
        ),
      },
      {
        h: "How we help",
        body: (
          <>
            Volicious <strong className="text-ink">weighs a spot's rating by how many reviews back it</strong>.
            Inflated ratings resting on a handful of reviews are treated with caution; ratings backed
            by thousands of real experiences rise to the top. What's left at the top of the list is
            places you can <strong className="text-ink">actually trust</strong>. We won't show you a
            formula or a complicated chart — just the answer: where to go.
          </>
        ),
      },
      {
        h: "Highlights from reviews",
        body: (
          <>
            Tap a spot and you'll see short summary tags distilled from real reviews (taste,
            cleanliness, service speed, staff, and so on). Without reading hundreds of lines of
            reviews, you'll know in seconds what a place is good at.
          </>
        ),
      },
    ],
    stepsHeading: "How to use it",
    steps: [
      "Pick a category on the home page (coffee, pizza, burger, and so on).",
      "Tap “List the top spots near me”.",
      "The best spots around you appear, ranked by their honest scores.",
    ],
    cta: "Start exploring →",
  },
  privacy: {
    back: "← Volicious",
    title: "Privacy Policy",
    updated: "Last updated: 4 July 2026",
    intro:
      "Volicious (“we”) is a discovery service that shows you the genuinely best spots nearest to you. Our aim is to deliver a lot of value with very little data; everything we collect is the minimum the service needs to work. This policy explains what we process and why, in plain language.",
    dataHeading: "Data we process",
    dataItems: [
      {
        k: "Approximate location:",
        v: "We read your browser's/device's location only when you press “list”, to find spots near you. It is used to run the spot search; it is not permanently tied to a profile of you.",
      },
      {
        k: "Random device identifier:",
        v: "A random identifier is stored on your device (browser storage) for fair use and the daily free-search quota. It does not identify you personally and is not linked to your identity, name or email.",
      },
      {
        k: "Technical logs:",
        v: "Standard server logs (request time, error information) may be kept temporarily to keep the service secure and working.",
      },
    ],
    noAccount: (
      <>
        We don't create accounts, and we <strong className="text-ink">don't collect</strong> your
        name, email or phone number.
      </>
    ),
    thirdPartyHeading: "Third-party services",
    thirdPartyItems: [
      {
        k: "Google Places:",
        v: "Spot information (name, rating, review count) comes from the Google Places API. Your location is passed to that service in order to run the search.",
      },
      {
        k: "Google AdSense (web):",
        v: "Google AdSense may be used to show ads on the website. AdSense and its partners may use cookies and similar technologies to serve relevant ads. You can manage ad personalisation in Google Ad Settings.",
      },
      {
        k: "Google AdMob (mobile):",
        v: "Rewarded ads in the mobile app are served through AdMob; similar advertising technologies apply.",
      },
      {
        k: "OpenAI:",
        v: "Publicly available review text is processed temporarily to summarise a spot's standout features; no personal data of yours is sent in this process.",
      },
    ],
    cookiesHeading: "Cookies and ads",
    cookiesText:
      "Ad providers (including Google) may use cookies to serve and measure ads. For users in the European Economic Area / United Kingdom, your consent is requested through a consent management mechanism where required. You can restrict cookies in your browser settings; ads may then be less relevant.",
    sharingHeading: "Sharing and retention",
    sharingText: (
      <>
        We <strong className="text-ink">do not sell</strong> your data. It is shared only with the
        third parties needed to provide the service (those listed above). We keep data only as long
        as its purpose requires.
      </>
    ),
    rightsHeading: "Your rights",
    rightsText:
      "Under GDPR (and Turkey's KVKK) you have the right to access, correct and request deletion of your data. You can send your request to the contact address below.",
    contactHeading: "Contact",
    contactText: "For questions:",
    home: "← Back to home",
  },
};

const DICTS: Record<Locale, Dict> = { tr, en };

export function getDict(locale: Locale): Dict {
  return DICTS[locale];
}

/**
 * Dile göre yol üretir. Türkçe = kök (önek YOK — mevcut adresler ve SEO korunur),
 * İngilizce = `/en` öneki. Sayfa "slug"ları da dile göre değişir (EN'de about/privacy).
 */
export type Page = "home" | "about" | "privacy";

const PATHS: Record<Locale, Record<Page, string>> = {
  tr: { home: "/", about: "/hakkinda", privacy: "/gizlilik" },
  en: { home: "/en", about: "/en/about", privacy: "/en/privacy" },
};

export function localePath(locale: Locale, page: Page): string {
  return PATHS[locale][page];
}

/**
 * hreflang/canonical için: bir sayfanın tüm dillerdeki adresleri.
 * `x-default` = hiçbir dil eşleşmezse Google'ın göstereceği sürüm (kök/Türkçe).
 */
export function alternates(page: Page) {
  return {
    canonical: PATHS[DEFAULT_LOCALE][page],
    languages: {
      tr: PATHS.tr[page],
      en: PATHS.en[page],
      "x-default": PATHS[DEFAULT_LOCALE][page],
    },
  };
}
