import Link from "next/link";
import { Mark } from "./Mark";

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          aria-label="Volicious ana sayfa"
        >
          <Mark size={26} className="text-ink transition-transform group-hover:-translate-y-0.5" />
          <span className="inline-flex items-baseline">
            <span className="text-[20px] font-extrabold tracking-[-0.03em]">Volicious</span>
            <span className="text-[20px] font-extrabold text-sage transition-transform group-hover:scale-125">
              .
            </span>
          </span>
        </Link>
        <span className="hidden font-mono text-xs uppercase tracking-[0.18em] text-stone sm:inline">
          Gerçek puan, gerçek mekan
        </span>
      </div>
    </header>
  );
}
