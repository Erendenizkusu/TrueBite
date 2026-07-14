import type { Locale } from "@truebite/shared";

/**
 * Konum açma yönergeleri — web.
 *
 * Tarayıcı, işletim sisteminin konum ayarlarını AÇAMAZ (mobil uygulamanın aksine deep-link yok).
 * Yapabileceğimiz en iyi şey: kullanıcının OS + tarayıcısını tespit edip BİREBİR adımları
 * göstermek. İki farklı engel vardır ve karıştırılırsa kullanıcı çıkmaza girer:
 *   - "permission" → sitenin tarayıcıdaki konum izni engellenmiş  → tarayıcı adımları
 *   - "services"   → cihazın/işletim sisteminin konum servisi kapalı → OS adımları
 */
export type Os = "windows" | "macos" | "android" | "ios" | "other";
export type Browser = "chrome" | "edge" | "safari" | "firefox" | "other";

export function detectOs(): Os {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  // iPadOS 13+ kendini Mac gibi tanıtır → dokunmatik varlığıyla ayır.
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) {
    return "ios";
  }
  if (/Android/.test(ua)) return "android";
  if (/Windows/.test(ua)) return "windows";
  if (/Macintosh|Mac OS X/.test(ua)) return "macos";
  return "other";
}

export function detectBrowser(): Browser {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "edge"; // Edge, Chrome'dan ÖNCE (UA'sında Chrome da geçer)
  if (/Firefox\/|FxiOS/.test(ua)) return "firefox";
  if (/Chrome\/|CriOS/.test(ua)) return "chrome";
  if (/Safari\//.test(ua)) return "safari"; // Safari, Chrome'dan SONRA (aynı sebeple)
  return "other";
}

function browserName(browser: Browser, locale: Locale): string {
  if (browser === "chrome") return "Chrome";
  if (browser === "edge") return "Edge";
  if (browser === "firefox") return "Firefox";
  if (browser === "safari") return "Safari";
  return locale === "en" ? "your browser" : "tarayıcın";
}

/** Sitenin tarayıcıdaki konum iznini yeniden açma adımları. */
export function permissionSteps(os: Os, browser: Browser, locale: Locale): string[] {
  const en = locale === "en";
  const reload = en ? "Reload the page and try again." : "Sayfayı yenile ve tekrar dene.";

  if (browser === "firefox") {
    return en
      ? [
          "Click the padlock icon on the left of the address bar.",
          "Remove the “Blocked” location permission with the × next to it.",
          reload,
        ]
      : [
          "Adres çubuğunun solundaki kilit simgesine tıkla.",
          "“Konum” için “Engellendi” yazan izni × ile kaldır.",
          reload,
        ];
  }
  if (browser === "safari" && os === "ios") {
    return en
      ? [
          "Tap the “aA” icon in the address bar.",
          "Choose “Website Settings” → “Location” → “Ask” or “Allow”.",
          reload,
        ]
      : [
          "Adres çubuğundaki “aA” simgesine dokun.",
          "“Web Sitesi Ayarları” → “Konum” → “Sor” ya da “İzin Ver” seç.",
          reload,
        ];
  }
  if (browser === "safari") {
    return en
      ? [
          "From the menu bar: Safari → Settings → “Websites” tab.",
          "Pick “Location” on the left, find this site in the list → “Allow”.",
          reload,
        ]
      : [
          "Menüden Safari → Ayarlar → “Web Siteleri” sekmesi.",
          "Soldan “Konum”u seç, listede bu siteyi bul → “İzin Ver”.",
          reload,
        ];
  }
  if (os === "android") {
    return en
      ? [
          "Tap the padlock icon in the address bar.",
          "Choose “Permissions” → “Location” → “Allow”.",
          reload,
        ]
      : [
          "Adres çubuğundaki kilit simgesine dokun.",
          "“İzinler” → “Konum” → “İzin ver” seç.",
          reload,
        ];
  }
  // Chrome / Edge — masaüstü
  return en
    ? [
        "Click the padlock (or settings) icon on the left of the address bar.",
        "Find the “Location” row → choose “Allow”.",
        reload,
      ]
    : [
        "Adres çubuğunun solundaki kilit (veya ayar) simgesine tıkla.",
        "“Konum” satırını bul → “İzin ver” seç.",
        reload,
      ];
}

/** Cihazın/işletim sisteminin konum servisini açma adımları. */
export function servicesSteps(os: Os, browser: Browser, locale: Locale): string[] {
  const en = locale === "en";
  const b = browserName(browser, locale);
  const reload = en ? "Reload the page and try again." : "Sayfayı yenile ve tekrar dene.";

  switch (os) {
    case "windows":
      return en
        ? [
            "Start → Settings → “Privacy & security” → “Location”.",
            "Turn ON the “Location services” toggle.",
            `“Let apps access your location” and “Let desktop apps access your location” must be on (${b} runs under the latter).`,
            reload,
          ]
        : [
            "Başlat → Ayarlar → “Gizlilik ve güvenlik” → “Konum”.",
            "“Konum hizmetleri” anahtarını AÇ.",
            `“Uygulamaların konumunuza erişmesine izin verin” ve “Masaüstü uygulamalarının konumunuza erişmesine izin verin” açık olmalı (${b} bunun altında çalışır).`,
            reload,
          ];
    case "macos":
      return en
        ? [
            "Apple menu → “System Settings” → “Privacy & Security” → “Location Services”.",
            "Turn ON the “Location Services” toggle.",
            `Tick the permission for ${b} in the list.`,
            reload,
          ]
        : [
            "Apple menüsü → “Sistem Ayarları” → “Gizlilik ve Güvenlik” → “Konum Servisleri”.",
            "“Konum Servisleri” anahtarını AÇ.",
            `Listede ${b} için izni işaretle.`,
            reload,
          ];
    case "android":
      return en
        ? [
            "Pull down the notification panel → tap the “Location” tile (or Settings → Location).",
            "Turn ON the “Use location” toggle.",
            reload,
          ]
        : [
            "Bildirim panelini aşağı çek → “Konum” simgesine dokun (ya da Ayarlar → Konum).",
            "“Konumu kullan” anahtarını AÇ.",
            reload,
          ];
    case "ios":
      return en
        ? [
            "Settings → “Privacy & Security” → “Location Services”.",
            "Turn ON the “Location Services” toggle.",
            `In the same list, choose “While Using the App” for ${b}.`,
            reload,
          ]
        : [
            "Ayarlar → “Gizlilik ve Güvenlik” → “Konum Servisleri”.",
            "“Konum Servisleri” anahtarını AÇ.",
            `Aynı listede ${b} için “Uygulamayı Kullanırken” seç.`,
            reload,
          ];
    default:
      return en
        ? [
            "Turn on location services in your device's system settings.",
            `Grant location permission for ${b}.`,
            reload,
          ]
        : [
            "Cihazının sistem ayarlarından konum servislerini aç.",
            `${b} için konum iznini ver.`,
            reload,
          ];
  }
}
