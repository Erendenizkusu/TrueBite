// Volicious marka işareti (V = konum pini): aşağıyı gösteren uç + yerdeki konum noktası,
// sol kolda çatal dişleri, sağ kolda bıçak ağzı. V rengi currentColor'dan gelir (yanındaki metne uyar).
export function Mark({ size = 26, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 122"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        fill="currentColor"
        d="M18 24 L44 24 L60 60 L76 24 L90 23 Q100 22 98 36 L60 96 Z M23.5 21 L26.3 21 L26.3 40 L23.5 40 Z M30 21 L32.8 21 L32.8 40 L30 40 Z M36.5 21 L39.3 21 L39.3 40 L36.5 40 Z"
      />
      <path d="M86 31 L62 86" stroke="rgba(255,255,255,.30)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M42 58 L60 63 L78 58 L60 96 Z" fill="#000" opacity="0.16" />
      <ellipse cx="60" cy="113" rx="18" ry="3.8" fill="#000" opacity="0.15" />
      <circle cx="60" cy="109.5" r="4.6" fill="#8C965E" />
    </svg>
  );
}
