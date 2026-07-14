import type { Metadata } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import { Hanken_Grotesk, JetBrains_Mono, Fraunces } from "next/font/google";
import { normalizeLocale } from "@truebite/shared";
import { Providers } from "./providers";
import "./globals.css";

// Web reklam (Google AdSense) — env-gated. Yalnızca yayıncı ID'si tanımlıysa script yüklenir
// (default-kapalı: maliyet/gizlilik güvenliği). Detay: components/AdSlot.tsx.
const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

const hanken = Hanken_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-hanken",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Display — zarif serif (roman + italik), müze/editöryel his (ref: PieterKoopt)
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-mono",
  weight: ["500", "700"],
  display: "swap",
});

// Sayfa başlığı/açıklaması her rotanın kendi `metadata`'sında (dile göre). Burada yalnızca
// tüm sayfalar için ortak olan taban ayarlar durur.
export const metadata: Metadata = {
  metadataBase: new URL("https://volicious.app"),
};

/**
 * `<html lang>` sayfanın diline göre değişmeli (erişilebilirlik + SEO). Tek bir kök layout
 * olduğundan dili middleware'in eklediği `x-locale` başlığından okuruz (yol önekinden türetilir).
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = normalizeLocale((await headers()).get("x-locale"));

  return (
    <html lang={lang} className={`${hanken.variable} ${fraunces.variable} ${mono.variable}`}>
      <body className="relative">
        {adsenseClient && (
          <Script
            id="adsbygoogle-init"
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          />
        )}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
