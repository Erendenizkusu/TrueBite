import { z } from "zod";

/** Ortam değişkenleri — uygulama açılışında doğrulanır. */
const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // Cache-miss isteklerinde gerekli; yoksa sadece cache-hit yolu çalışır.
  GOOGLE_PLACES_API_KEY: z.string().min(1).optional(),
  // AI "öne çıkan özellikler" için gerekli; yoksa highlights endpoint'i devre dışı.
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  PORT: z.coerce.number().int().positive().default(8787),
  // geohash hücre çözünürlüğü (önbellek anahtarı). 6 ≈ 1.2km hücre.
  CELL_PRECISION: z.coerce.number().int().min(1).max(12).default(6),
  // Kanıtlanmışlık/güven terimi ağırlığı (β): FinalScore += β·(log10(1+v)−log10(1+m)).
  // Bölge-altı puanlı ama çok-yorumlu (kanıtlanmış) markaları öne çıkarır. 0 = kapalı.
  // Kalibrasyon kolu — gerçek-veri geri bildirimiyle ayarlanır (bkz. bayesian-realscore-formula).
  TRUST_WEIGHT: z.coerce.number().min(0).max(2).default(0.25),

  // ─── Maliyet güvenliği (RELEASE.md § A / altın kural) ───
  // Kullanıcı(cihaz) başına GÜNLÜK ücretsiz istek. Bitince reklam izle → +istek.
  FREE_REQUESTS_PER_DAY: z.coerce.number().int().nonnegative().default(2),
  // Bir rewarded ad kaç ek istek kazandırır.
  AD_GRANT_REQUESTS: z.coerce.number().int().positive().default(1),
  // Global GÜNLÜK Google Places çağrı tavanı (sert maliyet koruması). ~$0.032/çağrı →
  // 300 çağrı ≈ $10/gün. Cache-miss başına ~5 çağrı (2x2 tiling). Deploy'da ayarla.
  DAILY_GOOGLE_BUDGET: z.coerce.number().int().positive().default(300),
  // Global AYLIK Google Places çağrı tavanı. 5000 çağrı ≈ $160/ay backstop.
  MONTHLY_GOOGLE_BUDGET: z.coerce.number().int().positive().default(5000),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return envSchema.parse(env);
}
