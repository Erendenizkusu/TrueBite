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
          <span className="text-[19px] font-extrabold uppercase leading-none tracking-[0.14em]">
            <span className="text-sage">V</span>OLICIOUS
          </span>
        </Link>
        <span className="hidden font-mono text-xs uppercase tracking-[0.18em] text-stone sm:inline">
          Gerçek puan, gerçek mekan
        </span>
      </div>
    </header>
  );
}
