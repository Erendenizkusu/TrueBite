import type { HighlightTag, HighlightsResult } from "@truebite/shared";

/** Orkestrasyon bağımlılıkları — test için enjekte edilir. */
export interface HighlightsDeps {
  freshHighlights: (placeId: string) => Promise<HighlightTag[] | null>;
  fetchReviews: (placeId: string) => Promise<string[]>;
  extract: (reviews: string[]) => Promise<HighlightTag[]>;
  upsert: (placeId: string, tags: HighlightTag[], count: number) => Promise<void>;
}

/**
 * AI öne çıkan özellikler akışı:
 *   1. Önbellekte taze etiket var mı? → Evet: doğrudan döndür (AI çağrısı yok).
 *   2. Yoksa → Google Details'tan yorumları çek → Claude ile etiketle → önbelleğe yaz.
 *
 * İkinci kullanıcı için AI'a tekrar para ödenmez (caching hayat kurtarır).
 */
export async function getHighlights(
  placeId: string,
  deps: HighlightsDeps,
): Promise<HighlightsResult> {
  const cached = await deps.freshHighlights(placeId);
  if (cached !== null) {
    return { placeId, tags: cached, cached: true, sourceReviewCount: 0 };
  }

  const reviews = await deps.fetchReviews(placeId);
  const tags = await deps.extract(reviews);
  await deps.upsert(placeId, tags, reviews.length);

  return { placeId, tags, cached: false, sourceReviewCount: reviews.length };
}
