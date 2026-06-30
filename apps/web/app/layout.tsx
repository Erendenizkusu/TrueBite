import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const hanken = Hanken_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-hanken",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-mono",
  weight: ["500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TrueBite — Sahte yorum yok, sadece en iyi mekanlar",
  description:
    "Konumuna en yakın, gerçekten en iyi puanlı restoranlar. Az yorumlu şişirilmiş puanları eleyen RealScore algoritmasıyla — dürüst, nokta atışı keşif.",
  metadataBase: new URL("https://truebite.app"),
  openGraph: {
    title: "TrueBite — Sahte yorum yok, sadece en iyi mekanlar",
    description:
      "Şişirilmiş 5.0'ları eleyen, köklü mekanları öne çıkaran RealScore'la gerçek keşif.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${hanken.variable} ${mono.variable}`}>
      <body className="relative">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
