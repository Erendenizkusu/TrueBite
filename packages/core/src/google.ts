import {
  placeSchema,
  categoryByKey,
  DEFAULT_FOOD_TYPES,
  type Place,
  type NearbyQuery,
} from "@truebite/shared";

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
 * Google Places (New) searchNearby yanıtını Volicious Place[]'e normalize eder.
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

/** Tek bir searchNearby çağrısı (verilen sıralama tercihiyle). */
async function callSearchNearby(
  body: Record<string, unknown>,
  apiKey: string,
): Promise<Place[]> {
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

/** searchNearby gövdesi (tek daire + tür + sıralama). */
function nearbyBody(
  lat: number,
  lng: number,
  radiusM: number,
  includedTypes: string[],
  rank: "POPULARITY" | "DISTANCE",
) {
  return {
    maxResultCount: 20, // Google üst sınırı
    includedTypes,
    rankPreference: rank,
    locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: radiusM } },
  };
}

/**
 * Arama dairesini NxN ızgaraya böler → alt-daire merkezleri (metre ofset → derece).
 * Google tek çağrıda max 20 döndürdüğü için tek daire yoğun bölgelerde çoğu mekânı kaçırır;
 * alt-bölgelere bölmek her bölgenin KENDİ top-20'sini getirir → kapsam katlanır.
 */
function tileCenters(lat: number, lng: number, radiusM: number, grid: number): [number, number][] {
  if (grid <= 1) return [[lat, lng]];
  const step = (radiusM * 0.8) / (grid - 1); // ızgara boyunca metre adımı
  const half = (grid - 1) / 2;
  const mPerDegLat = 111_320;
  const mPerDegLng = 111_320 * Math.cos((lat * Math.PI) / 180);
  const centers: [number, number][] = [];
  for (let iy = 0; iy < grid; iy++) {
    for (let ix = 0; ix < grid; ix++) {
      const oy = (iy - half) * step;
      const ox = (ix - half) * step;
      centers.push([lat + oy / mPerDegLat, lng + ox / mPerDegLng]);
    }
  }
  return centers;
}

// Kapsama/maliyet dengesi (empirik ölçüldü): 2x2 köşe ızgara = 4 alt-daire + 1 tüm-daire = 5 çağrı.
// 3x3 (10 çağrı) ile AYNI kaliteyi verir (~71 vs ~77 aday, aynı kaliteli-mekan yakalama) çünkü
// merkez/kenar tile'lar tüm-daire POPULARITY geçişiyle çakışıp boşa gidiyordu; asıl kapsamı köşeler
// sağlıyor. Böylece maliyet yarıya iner, kalite düşmez. (Tek daire ~20-38 idi → çoğu en-iyiyi kaçırırdı.)
const TILE_GRID = 2;

/**
 * Bir cache-miss'in yaptığı gerçek Google Places çağrı sayısı: 1 tüm-daire + TILE_GRID².
 * Maliyet güvenliği (bütçe sayacı) bu sabiti Google'a GİTMEDEN ÖNCE düşer (bkz. nearby.ts).
 */
export const GOOGLE_CALLS_PER_FETCH = 1 + TILE_GRID * TILE_GRID;

/**
 * Google Places (New) Nearby Search — yalnızca cache-miss durumunda çağrılır.
 *
 * KAPSAMLI ADAY HAVUZU (recall): Google tek çağrıda max 20 döndürür, sayfalama yok. Tek daire
 * yoğun bölgede gerçek en-iyileri (ör. Amada Coffee 4.6/1318) havuz DIŞINDA bırakıyordu. Çözüm:
 *   1. Tüm daire POPULARITY (genel öne çıkanlar),
 *   2. 2x2 köşe alt-daire POPULARITY (her köşe bölgenin top-20'si → 20-cap'i aşar).
 * = 5 çağrı, placeId ile tekilleştirilir → ~70+ aday. Precision (tür kesişimi + primaryType kapısı)
 * DB'de. Bir tile hatası tüm aramayı düşürmesin diye tek tek yutulur.
 *
 * includedTypes (gevşek) aday toplamak için doğru: Ono gibi primaryType'ı generic "restaurant"
 * olan gerçek mekânları da getirir. Kesin ayrım DB'de (nearby_places).
 */
export async function fetchNearbyFromGoogle(q: NearbyQuery, apiKey: string): Promise<Place[]> {
  const cat = categoryByKey(q.category);
  const includedTypes = cat.relevantTypes ?? DEFAULT_FOOD_TYPES;
  const subRadius = Math.max(300, Math.round(q.radiusM * 0.5)); // alt-daire yarıçapı (örtüşmeli)

  const bodies: Record<string, unknown>[] = [
    nearbyBody(q.lat, q.lng, q.radiusM, includedTypes, "POPULARITY"), // tüm daire
  ];
  for (const [tl, tn] of tileCenters(q.lat, q.lng, q.radiusM, TILE_GRID)) {
    bodies.push(nearbyBody(tl, tn, subRadius, includedTypes, "POPULARITY")); // alt-daireler
  }

  // Tüm çağrılar paralel; tek tile hatası boş dizi olur (arama düşmez).
  const results = await Promise.all(
    bodies.map((b) => callSearchNearby(b, apiKey).catch(() => [] as Place[])),
  );

  // placeId ile tekilleştir.
  const merged = new Map<string, Place>();
  for (const arr of results) for (const p of arr) if (!merged.has(p.placeId)) merged.set(p.placeId, p);
  return [...merged.values()];
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
