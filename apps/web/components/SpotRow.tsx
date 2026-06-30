import type { ScoredPlace } from "@truebite/shared";
import { RealScoreBadge } from "./RealScoreBadge";
import { fmtDistance, fmtReviews } from "@/lib/format";

export function SpotRow({ place, rank }: { place: ScoredPlace; rank: number }) {
  const lead = rank === 1;

  return (
    <li className="rise">
      <div
        className={`flex items-start gap-4 border-t py-5 transition-colors hover:bg-surface/60 sm:gap-6 ${
          lead ? "border-ink/20" : "border-line"
        }`}
      >
        <div
          className={`w-8 shrink-0 pt-1 font-mono text-base font-bold tabular-nums sm:w-12 sm:text-xl ${
            lead ? "text-ember" : "text-stone"
          }`}
        >
          {String(rank).padStart(2, "0")}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold tracking-[-0.01em] sm:text-xl">{place.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-stone">
            <span>{fmtDistance(place.distanceM)}</span>
            <span aria-hidden className="text-line">·</span>
            <span>{fmtReviews(place.userRatingsTotal)}</span>
          </div>
        </div>

        <RealScoreBadge place={place} lead={lead} />
      </div>
    </li>
  );
}
