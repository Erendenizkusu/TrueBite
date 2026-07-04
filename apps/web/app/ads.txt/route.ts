// /ads.txt — AdSense ZORUNLU dosyası: domain kökünde yayıncı kimliğini beyan eder (reklam
// sahteciliğini önler; onay ve reklam sunumu için gerekir). Statik dosya yerine route:
// NEXT_PUBLIC_ADSENSE_CLIENT ("ca-pub-…") girilince ads.txt kendini otomatik doldurur.
export const dynamic = "force-static";

export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim(); // "ca-pub-1234567890123456"
  const pub = client?.replace(/^ca-/, ""); // "pub-1234567890123456"
  // f08c47fec0942fa0 = Google'ın ads.txt sertifika-otorite kimliği (sabit, tüm yayıncılar için).
  const body = pub
    ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`
    : "# AdSense henuz yapilandirilmadi (NEXT_PUBLIC_ADSENSE_CLIENT bos).\n";
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
