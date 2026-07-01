import type { ScoredPlace } from "@truebite/shared";

/**
 * Müşteri-dostu rozet: büyük TrueBite Puanı + kanıt olarak ham Google puanı +
 * tek net güven etiketi. İç-mekanik (delta/"düzeltildi") gösterilmez.
 *   - çok yorumlu  → "✓ güvenilir"
 *   - az yorumlu   → "az yorumlu" (temkinli ol)
 */
export function RealScoreBadge({ place, lead }: { place: ScoredPlace; lead?: boolean }) {
  const strong = place.userRatingsTotal >= 300;

  return (
    <div className="flex shrink-0 flex-col items-end text-right">
      <div className="flex items-baseline gap-0.5">
        <span
          className={`font-mono font-bold leading-none tabular-nums ${
            lead ? "text-3xl text-ember sm:text-4xl" : "text-2xl text-ink sm:text-3xl"
          }`}
        >
          {place.realScore.toFixed(2)}
        </span>
        <span className="font-mono text-xs text-stone">/5</span>
      </div>
      <span className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-stone">
        TrueBite Puanı
      </span>

      {place.rating != null && (
        <span className="mt-2 text-xs text-stone">Google ★ {place.rating.toFixed(1)}</span>
      )}

      <span
        className={`mt-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
          strong ? "bg-pine-soft text-pine" : "bg-ember-soft text-ember-ink"
        }`}
      >
        {strong ? "✓ güvenilir" : "az yorumlu"}
      </span>
    </div>
  );
}
