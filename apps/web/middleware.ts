import { NextResponse, type NextRequest } from "next/server";

/**
 * Dil middleware'i. İki iş yapar:
 *
 * 1. `x-locale` başlığını ekler → kök layout `<html lang>`i buradan okur.
 * 2. İlk kez gelen ve tarayıcı dili Türkçe OLMAYAN ziyaretçiyi `/en` sürümüne yönlendirir.
 *
 * ⚠️ SEO KORUMASI (kritik): Arama motoru botları ASLA yönlendirilmez. Googlebot genelde
 * `Accept-Language: en` ile (ya da hiç göndermeden) gelir; yönlendirseydik kök adres `/`
 * Türkçe içerik yerine `/en`'e yönlenir ve mevcut Türkçe SEO birikimi zarar görürdü.
 * Botlar `/`'da Türkçe içeriği görür, `/en`'i de hreflang üzerinden ayrıca keşfeder.
 *
 * Kullanıcının seçimi `locale` çerezinde saklanır → dil değiştirdiyse bir daha zorlanmaz.
 */
const BOT_UA =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|whatsapp|telegram|lighthouse|headlesschrome/i;

const LOCALE_COOKIE = "locale";

/** Türkçe rotalar (kök = TR) → aynı sayfanın İngilizce karşılığı. */
const TR_TO_EN: Record<string, string> = {
  "/": "/en",
  "/hakkinda": "/en/about",
  "/gizlilik": "/en/privacy",
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");
  const locale = isEnglish ? "en" : "tr";

  // Kullanıcı /en'e girdiyse ya da dili elle seçtiyse tercihini çereze yaz → bir daha karışma.
  const chosen = req.cookies.get(LOCALE_COOKIE)?.value;

  const redirectTarget = shouldRedirectToEnglish(req, pathname, chosen)
    ? TR_TO_EN[pathname]
    : undefined;

  if (redirectTarget) {
    const url = req.nextUrl.clone();
    url.pathname = redirectTarget;
    const res = NextResponse.redirect(url);
    // Aynı adres tarayıcı diline göre farklı yanıt verebilir → ara katmanlar bunu bilmeli.
    res.headers.set("Vary", "Accept-Language");
    return res;
  }

  const res = NextResponse.next({ request: { headers: withLocale(req, locale) } });
  res.headers.set("x-locale", locale);
  if (chosen !== locale) res.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 31536000 });
  res.headers.set("Vary", "Accept-Language");
  return res;
}

function withLocale(req: NextRequest, locale: string): Headers {
  const h = new Headers(req.headers);
  h.set("x-locale", locale);
  return h;
}

function shouldRedirectToEnglish(
  req: NextRequest,
  pathname: string,
  chosen: string | undefined,
): boolean {
  if (!(pathname in TR_TO_EN)) return false; // yalnızca TR sayfalarından
  if (chosen) return false; // kullanıcı zaten bir dil seçmiş → saygı duy

  const ua = req.headers.get("user-agent") ?? "";
  if (BOT_UA.test(ua)) return false; // 🔒 botlar asla yönlendirilmez (SEO koruması)

  const accept = req.headers.get("accept-language");
  if (!accept) return false; // dil bilgisi yoksa varsayılan (TR) kalsın

  // Tarayıcının EN ÇOK tercih ettiği dil Türkçe mi? Değilse İngilizce sürüme gönder.
  const top = accept.split(",")[0]?.trim().toLowerCase() ?? "";
  return !top.startsWith("tr");
}

export const config = {
  // Statik dosyalar, API rotaları ve Next içi yollar dışındaki her şey.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|ads.txt).*)"],
};
