"use client";

import { useEffect } from "react";

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

/**
 * Google AdSense display reklam yuvası — web para modelinin reklam ayağı (altın kural / RELEASE.md § A).
 *
 * ⚠️ DEFAULT-KAPALI (maliyet/tasarım güvenliği): NEXT_PUBLIC_ADSENSE_CLIENT veya `slot` boşsa
 * HİÇBİR ŞEY render etmez (boş alan da bırakmaz). Reklamlar ancak şu üçü tamamlanınca görünür:
 *   1) sahip olunan gerçek domain (çıplak vercel.app AdSense'te reddedilir),
 *   2) AdSense'in siteyi ONAYLAMASI (günler-haftalar),
 *   3) client (ca-pub-…) + slot (reklam birimi) ID'lerinin env'e girilmesi.
 * Yani bu bileşen "hazır" ama env girilene kadar sessiz — AdMob rewarded ile aynı desen.
 */
export function AdSlot({
  slot,
  className = "",
  format = "auto",
}: {
  slot?: string;
  className?: string;
  format?: string;
}) {
  useEffect(() => {
    if (!CLIENT || !slot) return;
    try {
      // adsbygoogle global'i script yüklenince tanımlıdır; yuvayı doldurmak için push edilir.
      ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ||= []).push({});
    } catch {
      // reklam yüklenemezse sessiz geç — asıl içeriği/UI'ı asla bozma.
    }
  }, [slot]);

  if (!CLIENT || !slot) return null;

  return (
    <ins
      className={`adsbygoogle block ${className}`}
      style={{ display: "block" }}
      data-ad-client={CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
