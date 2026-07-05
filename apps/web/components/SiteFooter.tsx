import Link from "next/link";
import { Mark } from "./Mark";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <p className="flex items-center gap-2.5 text-lg font-extrabold uppercase leading-none tracking-[0.14em]">
            <Mark size={24} className="text-ink" />
            <span><span className="text-sage">V</span>OLICIOUS</span>
          </p>
          <p className="mt-1 font-mono text-sm text-stone">
            No fake reviews, just the best spots.
          </p>
          <div className="mt-3 flex gap-4 font-mono text-xs text-stone">
            <Link href="/hakkinda" className="underline-offset-2 hover:text-ink hover:underline">
              Hakkında
            </Link>
            <Link href="/gizlilik" className="underline-offset-2 hover:text-ink hover:underline">
              Gizlilik Politikası
            </Link>
          </div>
        </div>
        <p className="max-w-xs text-xs leading-relaxed text-stone">
          Veriler Google Places üzerinden alınır, Volicious RealScore (Bayesyen ağırlıklı puan)
          ile yeniden sıralanır. Puanlar yorum sayısına göre ağırlıklandırılır.
        </p>
      </div>
    </footer>
  );
}
