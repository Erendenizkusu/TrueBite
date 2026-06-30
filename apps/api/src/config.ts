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
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return envSchema.parse(env);
}
