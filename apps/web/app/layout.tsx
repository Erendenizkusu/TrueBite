import type { Metadata } from "next";
import Script from "next/script";
import { Hanken_Grotesk, JetBrains_Mono, Fraunces } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Volicious — Sahte yorum yok, sadece en iyi mekanlar",
  description:
    "Konumuna en yakın, gerçekten en iyi puanlı restoranlar. Az yorumlu şişirilmiş puanları eleyen RealScore algoritmasıyla — dürüst, nokta atışı keşif.",
  metadataBase: new URL("https://volicious.app"),
  openGraph: {
    title: "Volicious — Sahte yorum yok, sadece en iyi mekanlar",
    description:
      "Şişirilmiş 5.0'ları eleyen, köklü mekanları öne çıkaran RealScore'la gerçek keşif.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${hanken.variable} ${fraunces.variable} ${mono.variable}`}>
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
