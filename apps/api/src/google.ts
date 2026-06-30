import { placeSchema, type Place, type NearbyQuery } from "@truebite/shared";

/** Google Places (New) priceLevel enum → 0–4 / null. */
const PRICE_LEVELS: Record<string, number | null> = {
  PRICE_LEVEL_UNSPECIFIED: null,
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

/**
 * Google Places (New) searchNearby yanıtını TrueBite Place[]'e normalize eder.
 * Saf fonksiyon — test edilebilir. placeSchema ile doğrulanır (bozuk veri erken yakalanır).
 */
export function normalizeGooglePlaces(json: unknown): Place[] {
  const raw = (json as { places?: unknown[] } | null)?.places ?? [];
  return raw.map((item) => {
    const p = item as Record<string, any>;
    return placeSchema.parse({
      placeId: p.id,
      name: p.displayName?.text ?? "(isimsiz)",
      formattedAddress: p.formattedAddress ?? null,
      lat: p.location?.latitude,
      lng: p.location?.longitude,
      rating: typeof p.rating === "number" ? p.rating : null,
      userRatingsTotal: typeof p.userRatingCount === "number" ? p.userRatingCount : 0,
      priceLevel: p.priceLevel != null ? (PRICE_LEVELS[p.priceLevel] ?? null) : null,
      primaryType: p.primaryType ?? null,
      types: Array.isArray(p.types) ? p.types : [],
      businessStatus: p.businessStatus ?? null,
    });
  });
}

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.primaryType",
  "places.types",
  "places.businessStatus",
].join(",");

const SEARCH_NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby";

// Tür belirtilmezse yemek-odaklı mekanlar çekilir (restoran keşif uygulaması).
// Aksi halde Google her tür yeri döndürür (otopark, mağaza, belediye...).
const DEFAULT_FOOD_TYPES = [
  "restaurant",
  "cafe",
  "bakery",
  "bar",
  "meal_takeaway",
];

/** Google Places (New) Nearby Search — yalnızca cache-miss durumunda çağrılır. */
export async function fetchNearbyFromGoogle(q: NearbyQuery, apiKey: string): Promise<Place[]> {
  const body: Record<string, unknown> = {
    maxResultCount: Math.min(q.limit, 20), // Google üst sınırı 20
    locationRestriction: {
      circle: { center: { latitude: q.lat, longitude: q.lng }, radius: q.radiusM },
    },
  };
  body.includedTypes = q.type ? [q.type] : DEFAULT_FOOD_TYPES;

  const res = await fetch(SEARCH_NEARBY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Google Places ${res.status}: ${await res.text()}`);
  }
  return normalizeGooglePlaces(await res.json());
}

/**
 * Google Place Details (New) — bir mekanın yorumlarını (max 5, ToS) çeker.
 * Yalnızca AI özet için geçici kullanılır; metin saklanmaz.
 */
export async function fetchPlaceReviews(placeId: string, apiKey: string): Promise<string[]> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "reviews",
    },
  });
  if (!res.ok) {
    throw new Error(`Google Details ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as {
    reviews?: Array<{ text?: { text?: string }; originalText?: { text?: string } }>;
  };
  return (json.reviews ?? [])
    .map((r) => r.text?.text ?? r.originalText?.text ?? "")
    .filter((t) => t.trim().length > 0);
}
