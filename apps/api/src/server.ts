import Fastify from "fastify";
import { nearbyQuerySchema } from "@truebite/shared";
import { loadConfig, type AppConfig } from "./config.ts";
import {
  createSupabase,
  isCellFresh,
  queryNearby,
  upsertPlaces,
  touchCell,
  freshHighlights,
  upsertHighlights,
} from "./supabase.ts";
import { fetchNearbyFromGoogle, fetchPlaceReviews } from "./google.ts";
import { getNearby, type NearbyDeps } from "./nearby.ts";
import { extractHighlights, HIGHLIGHTS_MODEL } from "./ai.ts";
import { getHighlights, type HighlightsDeps } from "./highlights.ts";

export function buildServer(config: AppConfig) {
  const app = Fastify({ logger: true });
  const sb = createSupabase(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

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
    queryNearby: (q) => queryNearby(sb, q),
  };

  const hlDeps: HighlightsDeps = {
    freshHighlights: (placeId) => freshHighlights(sb, placeId),
    fetchReviews: (placeId) => {
      if (!config.GOOGLE_PLACES_API_KEY) throw new Error("GOOGLE_PLACES_API_KEY tanımlı değil");
      return fetchPlaceReviews(placeId, config.GOOGLE_PLACES_API_KEY);
    },
    extract: (reviews) => {
      if (!config.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY tanımlı değil");
      return extractHighlights(reviews, config.ANTHROPIC_API_KEY);
    },
    upsert: (placeId, tags, count) => upsertHighlights(sb, placeId, tags, count, HIGHLIGHTS_MODEL),
  };

  app.get("/health", async () => ({ ok: true }));

  app.get("/places/nearby", async (req, reply) => {
    const parsed = nearbyQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "invalid_query", details: parsed.error.flatten() });
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

  app.get("/places/:placeId/highlights", async (req, reply) => {
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
