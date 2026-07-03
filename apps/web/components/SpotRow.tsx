"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HIGHLIGHTS_MAX_RANK, type ScoredPlace, type HighlightsResult } from "@truebite/shared";
import { RealScoreBadge } from "./RealScoreBadge";
import { fmtDistance, fmtReviews } from "@/lib/format";

export function SpotRow({ place, rank }: { place: ScoredPlace; rank: number }) {
  const lead = rank === 1;
  // Maliyet güvenliği: AI öne çıkanlar yalnızca ilk N mekânda (her açış Google+AI maliyeti).
  const expandable = rank <= HIGHLIGHTS_MAX_RANK;
  const [open, setOpen] = useState(false);

  // AI öne çıkanları YALNIZCA kullanıcı satırı açınca çek (lazy — istem/maliyet kullanıcı
  // niyetiyle tetiklenir). Sonuç placeId başına cache'li → ikinci açış AI'a para ödetmez.
  const { data, isFetching, isError } = useQuery({
    queryKey: ["highlights", place.placeId],
    queryFn: async (): Promise<HighlightsResult> => {
      const r = await fetch(`/api/places/${encodeURIComponent(place.placeId)}/highlights`);
      if (!r.ok) throw new Error(`highlights ${r.status}`);
      return r.json();
    },
    enabled: open && expandable,
    staleTime: 1000 * 60 * 60, // 1 saat: aynı oturumda tekrar açış ağ isteği yapmaz
    retry: false,
  });

  const tags = data?.tags ?? [];

  const inner = (
    <>
      <div
        className={`w-8 shrink-0 pt-1 font-mono text-base font-bold tabular-nums sm:w-12 sm:text-xl ${
          lead ? "text-ember" : "text-stone"
        }`}
      >
        {String(rank).padStart(2, "0")}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="flex items-center gap-1.5 text-lg font-bold tracking-[-0.015em] sm:text-xl">
          <span className="truncate">{place.name}</span>
          {expandable && (
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className={`h-4 w-4 shrink-0 text-stone transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          )}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-stone">
          <span>{fmtDistance(place.distanceM)}</span>
          <span aria-hidden className="text-line">·</span>
          <span>{fmtReviews(place.userRatingsTotal)}</span>
        </div>
      </div>

      <RealScoreBadge place={place} lead={lead} />
    </>
  );

  const rowClass = `flex w-full items-start gap-4 border-t py-5 text-left sm:gap-6 ${
    lead ? "border-ink/20" : "border-line"
  }`;

  return (
    <li className="rise">
      {expandable ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`${rowClass} transition-colors hover:bg-surface/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sage`}
        >
          {inner}
        </button>
      ) : (
        <div className={rowClass}>{inner}</div>
      )}

      {expandable && open && (
        <div className="ml-12 border-t border-dashed border-line/70 pb-5 pt-3 sm:ml-[4.5rem]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-stone/80">
            Yorumlardan öne çıkanlar
          </p>
          {isFetching ? (
            <div className="flex flex-wrap gap-1.5" aria-hidden>
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className="h-6 w-20 animate-pulse rounded-full bg-sand" />
              ))}
            </div>
          ) : isError ? (
            <p className="text-sm text-stone/70">Öne çıkanlar şu an yüklenemedi.</p>
          ) : tags.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <li
                  key={t}
                  className="rounded-full border border-sage/40 bg-sage/10 px-2.5 py-1 text-xs font-medium text-pine"
                >
                  {t}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone/70">
              Bu mekân için henüz öne çıkan bir özellik derleyemedik.
            </p>
          )}
        </div>
      )}
    </li>
  );
}
