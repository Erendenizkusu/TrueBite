"use client";

import { useState } from "react";
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
}: {
  blocker: GeoBlocker | null;
  onRetry: () => void;
}) {
  const [showOther, setShowOther] = useState(false);
  // İlk render'da userAgent'a bakmak güvenli: bu bileşen yalnızca kullanıcı butona bastıktan
  // sonra (istemcide) görünür → SSR/hydration uyuşmazlığı doğmaz.
  const os: Os = detectOs();
  const browser: Browser = detectBrowser();

  if (blocker === "unsupported") {
    return (
      <Panel title="Tarayıcın konum desteklemiyor">
        <p className="text-sm text-stone">
          Bu tarayıcı konum paylaşımını desteklemiyor. Chrome, Edge, Safari ya da Firefox'un güncel
          bir sürümüyle tekrar dener misin?
        </p>
        <RetryButton onRetry={onRetry} />
      </Panel>
    );
  }

  if (blocker === "timeout") {
    return (
      <Panel title="Konumuna ulaşamadık">
        <p className="text-sm text-stone">
          Sinyal zayıf olabilir ya da işlem zaman aşımına uğradı. Birkaç saniye sonra tekrar denemek
          genelde çözer.
        </p>
        <RetryButton onRetry={onRetry} />
        <Toggle open={showOther} onToggle={() => setShowOther((v) => !v)}>
          Konumum kapalı olabilir mi?
        </Toggle>
        {showOther && <Steps steps={servicesSteps(os, browser)} />}
      </Panel>
    );
  }

  const isServices = blocker === "services";
  const primary = isServices ? servicesSteps(os, browser) : permissionSteps(os, browser);
  const secondary = isServices ? permissionSteps(os, browser) : servicesSteps(os, browser);

  return (
    <Panel
      title={isServices ? "Cihazının konumu kapalı" : "Konum izni verilmemiş"}
      lead={
        isServices
          ? "Cihazının konum servisi kapalı olduğu için çevrendeki mekanları bulamıyoruz. Açmak birkaç saniye sürer:"
          : "Bu siteye konum izni verilmemiş. Tarayıcından izni açman yeterli:"
      }
    >
      <Steps steps={primary} />
      <RetryButton onRetry={onRetry} />
      <Toggle open={showOther} onToggle={() => setShowOther((v) => !v)}>
        {isServices ? "Konumum açık, yine de çalışmıyor" : "İzni verdim, yine de çalışmıyor"}
      </Toggle>
      {showOther && (
        <>
          <p className="mt-3 text-xs text-stone/80">
            {isServices
              ? "O zaman sorun tarayıcı izninde olabilir:"
              : "O zaman cihazının konum servisi kapalı olabilir:"}
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

function RetryButton({ onRetry }: { onRetry: () => void }) {
  return (
    <button
      onClick={onRetry}
      className="mt-5 inline-flex min-h-11 items-center rounded-full bg-sage px-5 text-sm font-semibold text-paper transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
    >
      Açtım, tekrar dene
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
