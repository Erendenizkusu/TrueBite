/**
 * Soyut, blur'lu harita arka planı + merkezde "buradasın" nabzı.
 * Gerçek harita yerine stilize sokak ızgarası — güvenilir, anahtarsız, tasarlanmış görünür.
 * (İleride Maps Static API ile gerçek konuma çevrilebilir.)
 */
export function MapBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* sokak ızgarası */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0 46px, var(--color-line) 46px 47px), repeating-linear-gradient(90deg, transparent 0 46px, var(--color-line) 46px 47px)",
          filter: "blur(1.5px)",
          opacity: 0.7,
        }}
      />
      {/* ana arterler */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(118deg, transparent 47.5%, var(--color-sand) 47.5% 49%, transparent 49%), linear-gradient(22deg, transparent 61%, var(--color-sand) 61% 62.3%, transparent 62.3%)",
          opacity: 0.85,
        }}
      />
      {/* merkeze odak + kenarlara kağıda eriyiş */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0,var(--color-paper)_60%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-paper/20 via-transparent to-paper" />

      {/* buradasın */}
      <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2">
        <div className="relative h-4 w-4">
          <span className="pulsering absolute inset-0 rounded-full bg-ember/40" />
          <span
            className="pulsering absolute inset-0 rounded-full bg-ember/40"
            style={{ animationDelay: "1.2s" }}
          />
          <span className="absolute inset-0 rounded-full border-2 border-paper bg-ember shadow-sm" />
        </div>
      </div>
    </div>
  );
}
