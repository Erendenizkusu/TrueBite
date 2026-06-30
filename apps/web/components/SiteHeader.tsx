import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="relative z-20 border-b border-line/70">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="group inline-flex items-baseline" aria-label="TrueBite ana sayfa">
          <span className="text-[19px] font-extrabold tracking-[-0.03em]">TrueBite</span>
          <span className="text-[19px] font-extrabold text-ember transition-transform group-hover:scale-125">
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
