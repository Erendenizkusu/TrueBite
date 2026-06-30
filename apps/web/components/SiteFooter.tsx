export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <p className="text-lg font-extrabold tracking-[-0.02em]">
            TrueBite<span className="text-ember">.</span>
          </p>
          <p className="mt-1 font-mono text-sm text-stone">
            No fake reviews, just the best spots.
          </p>
        </div>
        <p className="max-w-xs text-xs leading-relaxed text-stone">
          Veriler Google Places üzerinden alınır, TrueBite RealScore (Bayesyen ağırlıklı puan)
          ile yeniden sıralanır. Puanlar yorum sayısına göre ağırlıklandırılır.
        </p>
      </div>
    </footer>
  );
}
