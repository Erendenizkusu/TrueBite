import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="group inline-flex items-baseline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          aria-label="TrueBite ana sayfa"
        >
          <span className="text-[20px] font-extrabold tracking-[-0.03em]">TrueBite</span>
          <span className="text-[20px] font-extrabold text-sage transition-transform group-hover:scale-125">
            .
          </span>
        </Link>
        <span className="hidden font-mono text-xs uppercase tracking-[0.18em] text-stone sm:inline">
          Gerçek puan, gerçek mekan
        </span>
      </div>
    </header>
  );
}
