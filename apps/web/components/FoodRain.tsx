import type { CSSProperties } from "react";

/**
 * Dekoratif "yiyecek yağmuru" — süzülen, dönen yemek parçaları.
 * - Masaüstü: yan sütunlardan yağar (boş yanları doldurur, merkez metin temiz).
 * - Mobil: yan boşluk yok → tüm genişliğe yayılır, metnin ARKASINDAN yağar
 *   (okunabilirlik katmanı merkezi soldurur, metin net kalır).
 * aria-hidden + pointer-events-none; prefers-reduced-motion'da gizlenir (globals.css).
 *
 * Parçalar deterministiktir (Math.random YOK) → SSR/CSR hidrasyon uyumsuzluğu olmaz.
 * Negatif delay'ler ekranı ilk karede dolu başlatır.
 */

type Piece = {
  e: string; // emoji (dekoratif — yapısal ikon değil)
  pos: number; // yerleşim referansı (%)
  side: "l" | "r"; // masaüstü: hangi kenardan
  size: number;
  dur: number;
  delay: number;
  rot: number;
  op: number;
  sway: number;
  swaydur: number;
};

// Masaüstü — yan sütunlar (sadece sm+ görünür)
const SIDE_PIECES: Piece[] = [
  { e: "🍔", side: "l", pos: 4, size: 48, dur: 17, delay: -3, rot: -300, op: 0.92, sway: 18, swaydur: 5.5 },
  { e: "☕", side: "l", pos: 9, size: 34, dur: 21, delay: -9, rot: 240, op: 0.7, sway: 12, swaydur: 6.5 },
  { e: "🍕", side: "l", pos: 1, size: 40, dur: 14, delay: -7, rot: 360, op: 0.85, sway: 22, swaydur: 4.8 },
  { e: "🍣", side: "l", pos: 12, size: 30, dur: 19, delay: -14, rot: -200, op: 0.6, sway: 10, swaydur: 7 },
  { e: "🥙", side: "l", pos: 6, size: 44, dur: 15.5, delay: -11, rot: 280, op: 0.88, sway: 16, swaydur: 5.2 },
  { e: "🍰", side: "l", pos: 13, size: 28, dur: 23, delay: -5, rot: -160, op: 0.55, sway: 9, swaydur: 8 },
  { e: "🍤", side: "l", pos: 2, size: 32, dur: 18, delay: -16, rot: 320, op: 0.65, sway: 14, swaydur: 6 },
  { e: "🍕", side: "r", pos: 4, size: 46, dur: 16, delay: -6, rot: 300, op: 0.9, sway: 20, swaydur: 5 },
  { e: "🥙", side: "r", pos: 10, size: 36, dur: 20, delay: -12, rot: -260, op: 0.72, sway: 13, swaydur: 6.8 },
  { e: "🍔", side: "r", pos: 1, size: 38, dur: 14.5, delay: -2, rot: -340, op: 0.85, sway: 22, swaydur: 4.6 },
  { e: "☕", side: "r", pos: 13, size: 30, dur: 22, delay: -17, rot: 220, op: 0.58, sway: 10, swaydur: 7.2 },
  { e: "🍣", side: "r", pos: 6, size: 42, dur: 15, delay: -10, rot: 360, op: 0.86, sway: 17, swaydur: 5.4 },
  { e: "🍤", side: "r", pos: 12, size: 28, dur: 24, delay: -4, rot: -180, op: 0.5, sway: 8, swaydur: 8.5 },
  { e: "🍰", side: "r", pos: 2, size: 34, dur: 18.5, delay: -15, rot: 280, op: 0.66, sway: 15, swaydur: 6.3 },
];

// Mobil — tüm genişliğe yayılır (sadece <sm görünür), metnin arkasından yağar
const SPREAD_PIECES: (Omit<Piece, "side"> & { left: number })[] = [
  { e: "🍔", left: 10, size: 34, dur: 15, delay: -2, rot: -280, op: 0.5, sway: 14, swaydur: 5 },
  { e: "🍕", left: 26, size: 30, dur: 18, delay: -8, rot: 300, op: 0.42, sway: 12, swaydur: 6 },
  { e: "☕", left: 42, size: 28, dur: 21, delay: -13, rot: 220, op: 0.38, sway: 10, swaydur: 7 },
  { e: "🥙", left: 58, size: 32, dur: 16, delay: -5, rot: -240, op: 0.46, sway: 13, swaydur: 5.4 },
  { e: "🍣", left: 74, size: 27, dur: 19, delay: -11, rot: 360, op: 0.4, sway: 11, swaydur: 6.4 },
  { e: "🍰", left: 88, size: 26, dur: 22, delay: -16, rot: -180, op: 0.36, sway: 9, swaydur: 7.6 },
  { e: "🍤", left: 34, size: 29, dur: 17.5, delay: -19, rot: 280, op: 0.44, sway: 12, swaydur: 5.8 },
  { e: "🍕", left: 66, size: 33, dur: 14.5, delay: -3, rot: -320, op: 0.48, sway: 15, swaydur: 4.9 },
  { e: "🍔", left: 82, size: 28, dur: 20, delay: -9, rot: 240, op: 0.4, sway: 10, swaydur: 6.8 },
  { e: "☕", left: 18, size: 26, dur: 23, delay: -14, rot: -200, op: 0.35, sway: 8, swaydur: 8 },
];

const shadow = "drop-shadow(0 6px 10px rgba(0,0,0,0.35))";

export function FoodRain() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
      {/* Masaüstü — yan sütunlar */}
      {SIDE_PIECES.map((p, i) => {
        const colStyle: CSSProperties =
          p.side === "l" ? { left: `${p.pos}%` } : { right: `${p.pos}%` };
        return (
          <span
            key={`s${i}`}
            className="foodfall absolute top-0 hidden sm:block"
            style={{
              ...colStyle,
              "--dur": `${p.dur}s`,
              "--delay": `${p.delay}s`,
              "--r1": `${p.rot}deg`,
              "--maxop": String(p.op),
            } as CSSProperties}
          >
            <span
              className="sway block select-none"
              style={{
                "--sway": `${p.side === "l" ? p.sway : -p.sway}px`,
                "--swaydur": `${p.swaydur}s`,
                "--delay": `${p.delay}s`,
                fontSize: `${p.size}px`,
                lineHeight: 1,
                filter: shadow,
              } as CSSProperties}
            >
              {p.e}
            </span>
          </span>
        );
      })}

      {/* Mobil — tüm genişliğe yayılır */}
      {SPREAD_PIECES.map((p, i) => (
        <span
          key={`m${i}`}
          className="foodfall absolute top-0 sm:hidden"
          style={{
            left: `${p.left}%`,
            "--dur": `${p.dur}s`,
            "--delay": `${p.delay}s`,
            "--r1": `${p.rot}deg`,
            "--maxop": String(p.op),
          } as CSSProperties}
        >
          <span
            className="sway block select-none"
            style={{
              "--sway": `${p.sway}px`,
              "--swaydur": `${p.swaydur}s`,
              "--delay": `${p.delay}s`,
              fontSize: `${p.size}px`,
              lineHeight: 1,
              filter: shadow,
            } as CSSProperties}
          >
            {p.e}
          </span>
        </span>
      ))}
    </div>
  );
}
