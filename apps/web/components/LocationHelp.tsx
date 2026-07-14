"use client";

import { useState } from "react";
import type { Locale } from "@truebite/shared";
import { getDict } from "@/lib/i18n";
import {
  detectBrowser,
  detectOs,
  permissionSteps,
  servicesSteps,
  type Browser,
  type Os,
} from "@/lib/locationHelp";

export type GeoBlocker = "permission" | "services" | "timeout" | "unsupported";

/**
 * Konum engellendiğinde gösterilen yönerge paneli.
 * Tarayıcı OS ayarlarını açamadığı için tek çare NET ADIMLAR göstermek — kullanıcılar aksi
 * halde konumu nereden açacaklarını bulamıyor (gerçek geri bildirim).
 * Engelin türünü kesin bilemediğimiz durumlar için diğer olasılık da katlanabilir şekilde durur.
 */
export function LocationHelp({
  blocker,
  onRetry,
  locale,
}: {
  blocker: GeoBlocker | null;
  onRetry: () => void;
  locale: Locale;
}) {
  const [showOther, setShowOther] = useState(false);
  const t = getDict(locale).location;
  // İlk render'da userAgent'a bakmak güvenli: bu bileşen yalnızca kullanıcı butona bastıktan
  // sonra (istemcide) görünür → SSR/hydration uyuşmazlığı doğmaz.
  const os: Os = detectOs();
  const browser: Browser = detectBrowser();

  if (blocker === "unsupported") {
    return (
      <Panel title={t.unsupportedTitle}>
        <p className="text-sm text-stone">{t.unsupportedText}</p>
        <RetryButton onRetry={onRetry} label={t.retry} />
      </Panel>
    );
  }

  if (blocker === "timeout") {
    return (
      <Panel title={t.timeoutTitle}>
        <p className="text-sm text-stone">{t.timeoutText}</p>
        <RetryButton onRetry={onRetry} label={t.retry} />
        <Toggle open={showOther} onToggle={() => setShowOther((v) => !v)}>
          {t.toggleFromPermission}
        </Toggle>
        {showOther && <Steps steps={servicesSteps(os, browser, locale)} />}
      </Panel>
    );
  }

  const isServices = blocker === "services";
  const primary = isServices
    ? servicesSteps(os, browser, locale)
    : permissionSteps(os, browser, locale);
  const secondary = isServices
    ? permissionSteps(os, browser, locale)
    : servicesSteps(os, browser, locale);

  return (
    <Panel
      title={isServices ? t.servicesTitle : t.permissionTitle}
      lead={isServices ? t.servicesLead : t.permissionLead}
    >
      <Steps steps={primary} />
      <RetryButton onRetry={onRetry} label={t.retry} />
      <Toggle open={showOther} onToggle={() => setShowOther((v) => !v)}>
        {isServices ? t.toggleFromServices : t.toggleFromPermission}
      </Toggle>
      {showOther && (
        <>
          <p className="mt-3 text-xs text-stone/80">
            {isServices ? t.otherFromServices : t.otherFromPermission}
          </p>
          <Steps steps={secondary} />
        </>
      )}
    </Panel>
  );
}

function Panel({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto mt-6 max-w-md rounded-2xl border border-sage/40 bg-surface/90 p-6 text-left backdrop-blur">
      <p className="font-display text-base font-bold tracking-[-0.01em] text-ink">{title}</p>
      {lead && <p className="mt-2 text-sm leading-relaxed text-stone">{lead}</p>}
      {children}
    </div>
  );
}

function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-3 space-y-2">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed text-stone">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage/15 font-mono text-[11px] font-semibold text-sage-ink">
            {i + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

function RetryButton({ onRetry, label }: { onRetry: () => void; label: string }) {
  return (
    <button
      onClick={onRetry}
      className="mt-5 inline-flex min-h-11 items-center rounded-full bg-sage px-5 text-sm font-semibold text-paper transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
    >
      {label}
    </button>
  );
}

function Toggle({
  open,
  onToggle,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onToggle}
      aria-expanded={open}
      className="mt-4 block text-left font-mono text-[11px] text-sage underline underline-offset-4 transition hover:text-sage-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
    >
      {children}
    </button>
  );
}
