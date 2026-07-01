/**
 * Tam-kanlı, blur'lu soyut harita arka planı + merkezde "buradasın" nabzı.
 * Stilize sokak ızgarası + park/blok lekeleri — güvenilir, anahtarsız, tasarlanmış.
 * Metin okunabilirliği için içerik tarafında yarı-saydam panel kullanılır.
 * (İleride Maps Static API ile gerçek konuma çevrilebilir.)
 */
export function MapBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* zemin tonu */}
      <div className="absolute inset-0 bg-surface" />

      {/* park / yeşil alan lekeleri */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(12% 16% at 18% 28%, var(--color-pine-soft) 0 60%, transparent 62%), radial-gradient(12% 14% at 82% 68%, var(--color-pine-soft) 0 60%, transparent 62%), radial-gradient(9% 11% at 66% 18%, var(--color-pine-soft) 0 60%, transparent 62%)",
          opacity: 0.7,
          filter: "blur(3px)",
        }}
      />

      {/* şehir blokları (kum tonu) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0 88px, var(--color-sand) 88px 96px), repeating-linear-gradient(90deg, transparent 0 120px, var(--color-sand) 120px 128px)",
          opacity: 0.5,
          filter: "blur(2px)",
        }}
      />

      {/* ince sokak ızgarası */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0 44px, var(--color-line) 44px 45px), repeating-linear-gradient(90deg, transparent 0 44px, var(--color-line) 44px 45px)",
          filter: "blur(1.2px)",
          opacity: 0.8,
        }}
      />

      {/* ana arterler */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(118deg, transparent 47.5%, var(--color-stone) 47.5% 48.6%, transparent 48.6%), linear-gradient(22deg, transparent 61%, var(--color-stone) 61% 61.9%, transparent 61.9%), linear-gradient(-54deg, transparent 33%, var(--color-stone) 33% 33.8%, transparent 33.8%)",
          opacity: 0.28,
          filter: "blur(0.5px)",
        }}
      />

      {/* çok hafif kenar yumuşaması — harita ekranı doldurur, yalnızca uç köşeler erir */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,transparent_0,transparent_62%,var(--color-paper)_100%)]" />
      {/* alt geçiş — sonuç bölümüne akışkan bağlanır */}
      <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-b from-transparent to-paper" />

      {/* buradasın */}
      <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2">
        <div className="relative h-4 w-4">
          <span className="pulsering absolute inset-0 rounded-full bg-ember/40" />
          <span
            className="pulsering absolute inset-0 rounded-full bg-ember/40"
            style={{ animationDelay: "1.2s" }}
          />
          <span className="absolute inset-0 rounded-full border-2 border-paper bg-ember shadow-md" />
        </div>
      </div>
    </div>
  );
}
