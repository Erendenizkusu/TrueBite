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

/** Sitenin tarayıcıdaki konum iznini yeniden açma adımları. */
export function permissionSteps(os: Os, browser: Browser): string[] {
  const reload = "Sayfayı yenile ve tekrar dene.";

  if (browser === "firefox") {
    return [
      "Adres çubuğunun solundaki kilit simgesine tıkla.",
      "“Konum” için “Engellendi” yazan izni × ile kaldır.",
      reload,
    ];
  }
  if (browser === "safari" && os === "ios") {
    return [
      "Adres çubuğundaki “aA” simgesine dokun.",
      "“Web Sitesi Ayarları” → “Konum” → “Sor” ya da “İzin Ver” seç.",
      reload,
    ];
  }
  if (browser === "safari") {
    return [
      "Menüden Safari → Ayarlar → “Web Siteleri” sekmesi.",
      "Soldan “Konum”u seç, listede bu siteyi bul → “İzin Ver”.",
      reload,
    ];
  }
  if (os === "android") {
    return [
      "Adres çubuğundaki kilit simgesine dokun.",
      "“İzinler” → “Konum” → “İzin ver” seç.",
      reload,
    ];
  }
  // Chrome / Edge — masaüstü
  return [
    "Adres çubuğunun solundaki kilit (veya ayar) simgesine tıkla.",
    "“Konum” satırını bul → “İzin ver” seç.",
    reload,
  ];
}

/** Cihazın/işletim sisteminin konum servisini açma adımları. */
export function servicesSteps(os: Os, browser: Browser): string[] {
  const b =
    browser === "chrome"
      ? "Chrome"
      : browser === "edge"
        ? "Edge"
        : browser === "firefox"
          ? "Firefox"
          : browser === "safari"
            ? "Safari"
            : "tarayıcın";

  switch (os) {
    case "windows":
      return [
        "Başlat → Ayarlar → “Gizlilik ve güvenlik” → “Konum”.",
        "“Konum hizmetleri” anahtarını AÇ.",
        `“Uygulamaların konumunuza erişmesine izin verin” ve “Masaüstü uygulamalarının konumunuza erişmesine izin verin” açık olmalı (${b} bunun altında çalışır).`,
        "Sayfayı yenile ve tekrar dene.",
      ];
    case "macos":
      return [
        "Apple menüsü → “Sistem Ayarları” → “Gizlilik ve Güvenlik” → “Konum Servisleri”.",
        "“Konum Servisleri” anahtarını AÇ.",
        `Listede ${b} için izni işaretle.`,
        "Sayfayı yenile ve tekrar dene.",
      ];
    case "android":
      return [
        "Bildirim panelini aşağı çek → “Konum” simgesine dokun (ya da Ayarlar → Konum).",
        "“Konumu kullan” anahtarını AÇ.",
        "Sayfayı yenile ve tekrar dene.",
      ];
    case "ios":
      return [
        "Ayarlar → “Gizlilik ve Güvenlik” → “Konum Servisleri”.",
        "“Konum Servisleri” anahtarını AÇ.",
        `Aynı listede ${b} için “Uygulamayı Kullanırken” seç.`,
        "Sayfayı yenile ve tekrar dene.",
      ];
    default:
      return [
        "Cihazının sistem ayarlarından konum servislerini aç.",
        `${b} için konum iznini ver.`,
        "Sayfayı yenile ve tekrar dene.",
      ];
  }
}
