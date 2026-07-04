/**
 * Volicious backend çekirdeği — TEK DOĞRULUK KAYNAĞI.
 * Fastify (apps/api, yerel dev) ve Next.js route'ları (apps/web, Vercel prod) buradan beslenir.
 * İş mantığı burada; HTTP kabuğu ince (server.ts / route.ts).
 */
export { loadConfig, type AppConfig } from "./config.ts";

export {
  createSupabase,
  isCellFresh,
  queryNearby,
  upsertPlaces,
  touchCell,
  freshHighlights,
  upsertHighlights,
  freshCategoryFit,
  upsertCategoryFit,
} from "./supabase.ts";

export { fetchNearbyFromGoogle, fetchPlaceReviews, GOOGLE_CALLS_PER_FETCH } from "./google.ts";

export { getNearby, type NearbyDeps } from "./nearby.ts";
export { refineByCategoryFit, type CategoryFitDeps } from "./categoryFit.ts";

export { extractHighlights, scoreCategoryFit, HIGHLIGHTS_MODEL } from "./ai.ts";
export { getHighlights, type HighlightsDeps } from "./highlights.ts";

export {
  consumeUserRequest,
  grantAdRequest,
  tryConsumeBudget,
  type QuotaResult,
  type BudgetResult,
  type GrantResult,
} from "./usage.ts";
