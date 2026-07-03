import Fastify from "fastify";
import { nearbyQuerySchema } from "@truebite/shared";
import {
  loadConfig,
  type AppConfig,
  createSupabase,
  isCellFresh,
  queryNearby,
  upsertPlaces,
  touchCell,
  freshHighlights,
  upsertHighlights,
  fetchNearbyFromGoogle,
  fetchPlaceReviews,
  GOOGLE_CALLS_PER_FETCH,
  getNearby,
  type NearbyDeps,
  extractHighlights,
  scoreCategoryFit,
  HIGHLIGHTS_MODEL,
  getHighlights,
  type HighlightsDeps,
  refineByCategoryFit,
  freshCategoryFit,
  upsertCategoryFit,
  consumeUserRequest,
  grantAdRequest,
  tryConsumeBudget,
} from "@truebite/core";

/** Kullanıcı(cihaz) kimliği: istemci device-id başlığı → yoksa IP (anonim kota/rate-limit temeli). */
function clientIdOf(req: { headers: Record<string, unknown>; ip: string }): string {
  const hdr = req.headers["x-client-id"];
  const id = Array.isArray(hdr) ? hdr[0] : hdr;
  return (typeof id === "string" && id.trim()) || req.ip || "unknown";
}

export function buildServer(config: AppConfig) {
  const app = Fastify({ logger: true });
  const sb = createSupabase(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

  // Body'siz / farklı content-type'lı POST'lar (örn. /quota/grant reklam callback'i) 415
  // vermesin. Default application/json parser korunur; '*' yalnızca eşleşmeyenler için fallback:
  // gövde yoksa boş nesne, JSON ise parse et, aksi halde toleranslı boş nesne.
  app.addContentTypeParser("*", { parseAs: "string" }, (_req, body, done) => {
    const s = (body as string)?.trim();
    if (!s) return done(null, {});
    try {
      done(null, JSON.parse(s));
    } catch {
      done(null, {});
    }
  });

  const deps: NearbyDeps = {
    cellPrecision: config.CELL_PRECISION,
    isCellFresh: (cellId, bucket) => isCellFresh(sb, cellId, bucket),
    fetchFromGoogle: (q) => {
      if (!config.GOOGLE_PLACES_API_KEY) {
        throw new Error("GOOGLE_PLACES_API_KEY tanımlı değil — cache-miss isteği yapılamıyor");
      }
      return fetchNearbyFromGoogle(q, config.GOOGLE_PLACES_API_KEY);
    },
    upsertPlaces: (places) => upsertPlaces(sb, places),
    touchCell: (cellId, bucket, count) => touchCell(sb, cellId, bucket, count),
    queryNearby: (q) => queryNearby(sb, q, config.TRUST_WEIGHT),
    // Maliyet güvenliği: cache-miss'te global günlük/aylık bütçe tavanını dener.
    tryConsumeBudget: async (calls) =>
      (await tryConsumeBudget(sb, calls, config.DAILY_GOOGLE_BUDGET, config.MONTHLY_GOOGLE_BUDGET))
        .allowed,
    googleCallsPerFetch: GOOGLE_CALLS_PER_FETCH,
    // AI kategori-uyum katmanı — yalnızca açık (topN>0) + anahtarlar varsa; aksi halde bypass.
    refineByCategoryFit:
      config.CATEGORY_FIT_TOP_N > 0 && config.OPENAI_API_KEY && config.GOOGLE_PLACES_API_KEY
        ? (places, q) =>
            refineByCategoryFit(places, q, {
              topN: config.CATEGORY_FIT_TOP_N,
              floor: config.CATEGORY_FIT_FLOOR,
              freshFit: (placeId, category) => freshCategoryFit(sb, placeId, category),
              fetchReviews: (placeId) => fetchPlaceReviews(placeId, config.GOOGLE_PLACES_API_KEY!),
              scoreFit: (reviews, label) => scoreCategoryFit(reviews, label, config.OPENAI_API_KEY!),
              upsertFit: (placeId, category, fit, count) =>
                upsertCategoryFit(sb, placeId, category, fit, count, HIGHLIGHTS_MODEL),
              tryConsumeBudget: async (calls) =>
                (
                  await tryConsumeBudget(
                    sb,
                    calls,
                    config.DAILY_GOOGLE_BUDGET,
                    config.MONTHLY_GOOGLE_BUDGET,
                  )
                ).allowed,
            })
        : undefined,
  };

  const hlDeps: HighlightsDeps = {
    freshHighlights: (placeId) => freshHighlights(sb, placeId),
    fetchReviews: (placeId) => {
      if (!config.GOOGLE_PLACES_API_KEY) throw new Error("GOOGLE_PLACES_API_KEY tanımlı değil");
      return fetchPlaceReviews(placeId, config.GOOGLE_PLACES_API_KEY);
    },
    extract: (reviews) => {
      if (!config.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY tanımlı değil");
      return extractHighlights(reviews, config.OPENAI_API_KEY);
    },
    upsert: (placeId, tags, count) => upsertHighlights(sb, placeId, tags, count, HIGHLIGHTS_MODEL),
  };

  app.get("/health", async () => ({ ok: true }));

  // NOT: Yollar Vercel (apps/web) route'larıyla BİREBİR AYNI (/api/*) — mobil/istemci yalnızca
  // BASE URL değiştirir (yerel Fastify ↔ Vercel), yol şeması tektir.
  app.get("/api/nearby", async (req, reply) => {
    const parsed = nearbyQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "invalid_query", details: parsed.error.flatten() });
    }

    // Maliyet güvenliği: cihaz-başına günlük kota. Bitince istemci "reklam izle → +istek"
    // akışına yönlendirilir (429). Kota bilgisi header ile döner (istemci kalan hakkı gösterir).
    const clientId = clientIdOf(req);
    const quota = await consumeUserRequest(sb, clientId, config.FREE_REQUESTS_PER_DAY);
    reply.header("X-Quota-Limit", String(quota.limit));
    reply.header("X-Quota-Remaining", String(quota.remaining));
    if (!quota.allowed) {
      return reply.status(429).send({
        error: "quota_exceeded",
        reason: "watch_ad",
        limit: quota.limit,
        remaining: 0,
      });
    }

    try {
      return await getNearby(parsed.data, deps);
    } catch (err) {
      req.log.error(err);
      return reply
        .status(502)
        .send({ error: "upstream_error", message: (err as Error).message });
    }
  });

  // Rewarded ad tamamlandığında istemci bunu çağırır → +istek hakkı.
  // ⚠️ ÜRETİM: AdMob sunucu-taraflı doğrulama (SSV) ile KORUNMALI — aksi halde herkes
  // curl ile bedava kota üretir. Şu an MVP/yerel için açık stub (bkz. RELEASE.md § A).
  app.post("/api/quota/grant", async (req, reply) => {
    const clientId = clientIdOf(req);
    try {
      const g = await grantAdRequest(sb, clientId, config.AD_GRANT_REQUESTS);
      return { granted: g.granted, grants: g.grants };
    } catch (err) {
      req.log.error(err);
      return reply.status(502).send({ error: "upstream_error", message: (err as Error).message });
    }
  });

  app.get("/api/places/:placeId/highlights", async (req, reply) => {
    const { placeId } = req.params as { placeId: string };
    if (!placeId) {
      return reply.status(400).send({ error: "place_id gerekli" });
    }
    try {
      return await getHighlights(placeId, hlDeps);
    } catch (err) {
      req.log.error(err);
      return reply
        .status(502)
        .send({ error: "upstream_error", message: (err as Error).message });
    }
  });

  return app;
}

// Doğrudan çalıştırıldığında sunucuyu ayağa kaldır (testler bu dosyayı import etmez).
const config = loadConfig();
const app = buildServer(config);
app
  .listen({ port: config.PORT, host: "0.0.0.0" })
  .then((addr) => app.log.info(`TrueBite API hazır: ${addr}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
