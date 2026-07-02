"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { NearbyResult } from "@truebite/shared";
import { CATEGORIES } from "@/lib/categories";
import { getClientId } from "@/lib/clientId";
import { MapBackdrop } from "./MapBackdrop";
import { FoodRain } from "./FoodRain";
import { SpotRow } from "./SpotRow";

type Status = "idle" | "locating" | "ready" | "denied";

export function DiscoverApp() {
  const [catIdx, setCatIdx] = useState(0);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const cat = CATEGORIES[catIdx]!;
  const resultsRef = useRef<HTMLElement>(null);
  // Maliyet güvenliği kotası (RELEASE.md § A) — sunucudan header ile gelir.
  const [quota, setQuota] = useState<{ remaining: number | null; limit: number | null } | null>(
    null,
  );
  const [granting, setGranting] = useState(false);

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["nearby", coords?.lat, coords?.lng, cat.key],
    queryFn: async (): Promise<NearbyResult> => {
      const qs = new URLSearchParams({
        lat: String(coords!.lat),
        lng: String(coords!.lng),
        radiusM: "4000",
        limit: "12",
      });
      if (cat.key !== "all") qs.set("category", cat.key);
      const r = await fetch(`/api/nearby?${qs.toString()}`, {
        headers: { "X-Client-Id": getClientId() },
      });
      // Kalan kota her yanıtta header'da gelir (200 ve 429).
      const rem = r.headers.get("x-quota-remaining");
      const lim = r.headers.get("x-quota-limit");
      setQuota({ remaining: rem != null ? Number(rem) : null, limit: lim != null ? Number(lim) : null });
      // Kota doldu → ayrı ekran (gerçek hatadan farklı, tekrar denemek anlamsız).
      if (r.status === 429) throw Object.assign(new Error("quota_exceeded"), { code: "quota" });
      // Diğer hataları yut­ma: fırlat ki UI "sonuç yok" yerine "sunucuya ulaşılamadı" göstersin.
      if (!r.ok) throw new Error(`nearby ${r.status}`);
      return r.json();
    },
    enabled: status === "ready" && !!coords,
    // Kota hatasında tekrar deneme (429 kalır); yalnızca geçici hatada 1 kez dene.
    retry: (count, err) => ((err as { code?: string })?.code === "quota" ? false : count < 1),
  });

  const quotaExceeded = isError && (error as { code?: string })?.code === "quota";

  // "Reklam izle → +1 keşif" (STUB: gerçek reklam entegrasyonuna kadar geçici).
  async function watchAdForMore() {
    setGranting(true);
    try {
      const r = await fetch("/api/quota/grant", {
        method: "POST",
        headers: { "X-Client-Id": getClientId() },
      });
      if (r.ok) await refetch();
    } finally {
      setGranting(false);
    }
  }

  // Konum alınınca sonuçlara yumuşakça kaydır (uzamsal süreklilik)
  useEffect(() => {
    if (status === "ready") {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [status]);

  function locateAndSearch() {
    if (!navigator.geolocation) {
      setStatus("denied");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("ready");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 9000 },
    );
  }

  const places = data?.places ?? [];

  return (
    <>
      {/* ---- Hero: tam-kanlı çerçeveli kart ---- */}
      <section className="relative flex min-h-dvh flex-col justify-center overflow-hidden">
        <MapBackdrop />
        <FoodRain />

        {/* metin sütununun arkasına yumuşak okunabilirlik katmanı (kenarlar dokulu kalır) */}
        <div
          aria-hidden
          className="absolute inset-0 z-[2] bg-[radial-gradient(62%_56%_at_50%_48%,var(--color-paper)_30%,transparent_80%)]"
        />

        {/* içerik — geniş, kompakt; buton katlama üstünde kalır */}
        <div className="relative z-10 mx-auto w-full max-w-4xl px-5 py-16 text-center">
          <p className="rise inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-stone backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-sage" />
            Dürüst mekan keşfi
          </p>

          <h1 className="rise mx-auto mt-6 max-w-3xl font-display text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.01em] sm:text-[3.6rem]">
            Gözlerini kapat!
            <br />
            <em className="font-medium italic text-sage">Seni harika bir yere götürüyorum.</em>
          </h1>

          <p className="rise mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-stone sm:text-base">
            Algoritmamız şişirilmiş ve sahte puanları ayıkladı, binlerce yorumu ağırlıklandırdı.
            Konumundaki en popüler ve dürüst mekanlar tek tıkla karşında.{" "}
            <strong className="font-semibold text-ink">Hadi tıkla da gidelim.</strong>
          </p>

            {/* kategori filtreleri — mobilde yatay kaydırma, geniş ekranda ortalı sarma */}
            <div
              role="tablist"
              aria-label="Mekan kategorisi"
              className="rise no-scrollbar -mx-5 mt-8 flex snap-x gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible"
            >
              {CATEGORIES.map((c, i) => {
                const active = i === catIdx;
                return (
                  <button
                    key={c.label}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setCatIdx(i)}
                    className={`inline-flex min-h-11 shrink-0 snap-start items-center rounded-full px-4 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
                      active
                        ? "bg-sage font-semibold text-paper"
                        : "border border-line bg-surface/80 font-medium text-ink backdrop-blur hover:border-sage/50"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            {/* merkezi CTA */}
            <div className="rise mt-8">
              <button
                onClick={locateAndSearch}
                disabled={status === "locating"}
                aria-busy={status === "locating"}
                className="group inline-flex items-center gap-2.5 rounded-full bg-sage px-7 py-4 text-base font-semibold text-paper shadow-[0_10px_34px_-10px_rgba(169,178,126,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_44px_-12px_rgba(169,178,126,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:translate-y-0 disabled:opacity-70 sm:text-lg"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-paper/60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-paper" />
                </span>
                {status === "locating"
                  ? "Konumun bulunuyor…"
                  : `Konumumdaki en popüler ${cat.ctaNoun} listele`}
              </button>

              <p className="mx-auto mt-4 max-w-sm text-xs text-stone">
                {status === "denied"
                  ? "Konuma ulaşamadık — tarayıcı konum iznini açıp tekrar dene."
                  : "Tek dokunuş. Konumundaki en iyileri RealScore'a göre sıralayalım — şişirilmiş puanlar elenir."}
              </p>
            </div>
          </div>

          {/* alt şerit — marka mottosu (ref: müze kapsiyonu) */}
          <p className="absolute inset-x-0 bottom-5 z-10 hidden text-center font-mono text-[11px] uppercase tracking-[0.28em] text-stone/70 sm:block">
            No fake reviews · just the best spots
          </p>
      </section>

      {/* ---- Sonuçlar ---- */}
      {status === "ready" && (
        <section ref={resultsRef} className="relative z-10 mx-auto max-w-3xl scroll-mt-4 px-5 pb-24 sm:px-8">
          <div className="flex items-center justify-between border-b border-line py-4">
            <h2 className="font-display text-lg font-bold tracking-[-0.02em] sm:text-xl">
              {cat.key === "all" ? "En iyi mekanlar" : `En iyi ${cat.label.toLowerCase()} mekanları`}
            </h2>
            {quota?.remaining != null && !quotaExceeded ? (
              <span className="font-mono text-[11px] text-stone" title="Bugünkü ücretsiz keşif hakkın">
                bugün {quota.remaining} keşif kaldı
              </span>
            ) : data ? (
              <span className="font-mono text-[11px] text-stone">
                {isFetching ? "sıralanıyor…" : data.cacheHit ? "● anlık" : "● az önce güncellendi"}
              </span>
            ) : null}
          </div>

          {quotaExceeded ? (
            <LimitReached onWatchAd={watchAdForMore} granting={granting} />
          ) : isFetching && places.length === 0 ? (
            <Loading />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : places.length === 0 ? (
            <Empty />
          ) : (
            <ol>
              {places.map((p, i) => (
                <SpotRow key={p.placeId} place={p} rank={i + 1} />
              ))}
            </ol>
          )}
        </section>
      )}
    </>
  );
}

function Loading() {
  // Skeleton — SpotRow düzenini taklit eder (§3 progressive-loading, CLS önler)
  return (
    <ol aria-hidden className="animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-start gap-4 border-t border-line py-5 sm:gap-6">
          <div className="h-5 w-8 shrink-0 rounded bg-sand sm:w-12" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="h-5 w-1/2 rounded bg-sand" />
            <div className="h-3.5 w-1/3 rounded bg-sand/70" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="h-8 w-14 rounded bg-sand" />
            <div className="h-3 w-16 rounded bg-sand/70" />
          </div>
        </li>
      ))}
    </ol>
  );
}

function Empty() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
      <p className="font-mono text-sm text-stone">bu kategoride yakınında mekan bulunamadı</p>
      <p className="mx-auto mt-2 max-w-xs text-sm text-stone/80">
        Yarıçapı genişletmeyi ya da farklı bir kategori denemeyi dene.
      </p>
    </div>
  );
}

function LimitReached({ onWatchAd, granting }: { onWatchAd: () => void; granting: boolean }) {
  // Kota doldu — maliyet güvenliği (altın kural). Kullanıcıyı reklamla ödüllendir ya da yarını beklet.
  return (
    <div className="mt-6 rounded-2xl border border-sage/40 bg-sage/10 px-6 py-16 text-center">
      <p className="font-display text-lg font-bold tracking-[-0.01em] text-ink">
        Bugünlük ücretsiz keşif hakkın doldu
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-stone">
        Kaliteli mekan verisi bize maliyet doğurur; adil kullanım için günlük bir sınır var.
        Kısa bir reklam izleyerek bir keşif daha açabilir ya da yarın devam edebilirsin.
      </p>
      <button
        onClick={onWatchAd}
        disabled={granting}
        aria-busy={granting}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-sage px-5 text-sm font-semibold text-paper transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:translate-y-0 disabled:opacity-70"
      >
        {granting ? "hazırlanıyor…" : "Reklam izle → 1 keşif daha"}
      </button>
      <p className="mx-auto mt-3 text-[11px] text-stone/70">Kota her gün sıfırlanır.</p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  // Sunucu/ağ hatası — "sonuç yok"tan ayrı; kullanıcıyı yanıltmaz, tekrar dene sunar.
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-ember/40 bg-ember-soft/40 px-6 py-16 text-center">
      <p className="font-mono text-sm text-ember-ink">şu an listeye ulaşamadık</p>
      <p className="mx-auto mt-2 max-w-xs text-sm text-stone/80">
        Sunucuya bağlanırken bir sorun oldu. Birkaç saniye sonra tekrar dene.
      </p>
      <button
        onClick={onRetry}
        className="mt-5 inline-flex min-h-11 items-center rounded-full bg-sage px-5 text-sm font-semibold text-paper transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        Tekrar dene
      </button>
    </div>
  );
}
