"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { NearbyResult } from "@truebite/shared";
import { CATEGORIES } from "@/lib/categories";
import { MapBackdrop } from "./MapBackdrop";
import { SpotRow } from "./SpotRow";

type Status = "idle" | "locating" | "ready" | "denied";

export function DiscoverApp() {
  const [catIdx, setCatIdx] = useState(0);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const cat = CATEGORIES[catIdx]!;

  const { data, isFetching } = useQuery({
    queryKey: ["nearby", coords?.lat, coords?.lng, cat.type],
    queryFn: async (): Promise<NearbyResult | null> => {
      const qs = new URLSearchParams({
        lat: String(coords!.lat),
        lng: String(coords!.lng),
        radiusM: "2500",
        limit: "24",
      });
      if (cat.type) qs.set("type", cat.type);
      const r = await fetch(`/api/nearby?${qs.toString()}`);
      return r.ok ? r.json() : null;
    },
    enabled: status === "ready" && !!coords,
  });

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
      {/* ---- Hero / arama ---- */}
      <section className="relative overflow-hidden">
        <MapBackdrop />
        <div className="relative z-10 mx-auto max-w-3xl px-5 pt-16 pb-14 text-center sm:pt-24 sm:pb-20">
          <p className="rise font-mono text-xs uppercase tracking-[0.22em] text-stone">
            Dürüst mekan keşfi
          </p>

          <h1 className="rise mx-auto mt-5 max-w-2xl text-[2.5rem] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-6xl">
            Yıldız avcılığına son.
            <br />
            <span className="text-ember">Gerçekten</span> iyi mekanlar.
          </h1>

          <p className="rise mx-auto mt-6 max-w-xl text-lg leading-relaxed text-stone">
            TrueBite, binlerce yorumla kanıtlanmış köklü mekanları öne çıkarır; bir avuç yorumla
            şişirilmiş puanları geri plana atar. Sen sadece <strong className="font-semibold text-ink">nereye</strong>{" "}
            gideceğini seç.
          </p>

          {/* kategori filtreleri */}
          <div className="rise mt-9 flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((c, i) => {
              const active = i === catIdx;
              return (
                <button
                  key={c.label}
                  onClick={() => setCatIdx(i)}
                  className={
                    active
                      ? "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper"
                      : "rounded-full border border-line bg-surface/70 px-4 py-2 text-sm font-medium text-ink backdrop-blur transition hover:border-ink/40"
                  }
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* merkezi CTA */}
          <div className="rise mt-9">
            <button
              onClick={locateAndSearch}
              disabled={status === "locating"}
              className="group inline-flex items-center gap-2.5 rounded-full bg-ember px-7 py-4 text-base font-semibold text-white shadow-[0_8px_30px_-8px_rgba(255,74,28,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-10px_rgba(255,74,28,0.7)] disabled:translate-y-0 disabled:opacity-70 sm:text-lg"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
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
      </section>

      {/* ---- Sonuçlar ---- */}
      {status === "ready" && (
        <section className="relative z-10 mx-auto max-w-3xl px-5 pb-24 sm:px-8">
          <div className="flex items-center justify-between border-b border-line py-4">
            <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-stone">
              {cat.label === "Tümü" ? "En iyi mekanlar" : `En iyi ${cat.label.toLowerCase()} mekanları`}
            </h2>
            {data && (
              <span className="font-mono text-[11px] text-stone">
                {isFetching ? "sıralanıyor…" : data.cacheHit ? "● anlık" : "● az önce güncellendi"}
              </span>
            )}
          </div>

          {isFetching && places.length === 0 ? (
            <Loading />
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
  return (
    <div className="flex justify-center py-20">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-ember" />
    </div>
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
