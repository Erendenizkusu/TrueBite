import {
  cellId as toCellId,
  radiusBucket,
  type NearbyQuery,
  type NearbyResult,
  type Place,
  type ScoredPlace,
} from "@truebite/shared";

/**
 * Orkestrasyon bağımlılıkları — test edilebilirlik için enjekte edilir
 * (gerçek Supabase/Google yerine sahte fonksiyonlar geçilebilir).
 */
export interface NearbyDeps {
  cellPrecision: number;
  isCellFresh: (cellId: string, bucket: number) => Promise<boolean>;
  fetchFromGoogle: (q: NearbyQuery) => Promise<Place[]>;
  upsertPlaces: (places: Place[]) => Promise<number>;
  touchCell: (cellId: string, bucket: number, count: number) => Promise<void>;
  queryNearby: (q: NearbyQuery) => Promise<ScoredPlace[]>;
}

/**
 * /places/nearby çekirdek akışı (ince orkestrasyon):
 *   1. Konumu grid hücresine yuvarla (önbellek anahtarı).
 *   2. Hücre taze mi? Evet → doğrudan DB'den servis (Google'a gidilmez).
 *   3. Hayır/bayat → Google → upsert → cache_cells tazele → DB'den servis.
 *
 * Skorlama ve geo filtre DAİMA DB'de (nearby_places). Burada hesap yok.
 */
export async function getNearby(q: NearbyQuery, deps: NearbyDeps): Promise<NearbyResult> {
  const cellId = toCellId(q.lat, q.lng, deps.cellPrecision);
  const bucket = radiusBucket(q.radiusM);
  // Tür filtresi önbellek kimliğine katılır → her kategori kendi tazeliğine sahip
  // (örn. "kahve" araması, daha önce "tümü" cache'lense bile Google'a taze gider).
  const freshnessKey = q.type ? `${cellId}:${q.type}` : cellId;

  let cacheHit = true;
  if (!(await deps.isCellFresh(freshnessKey, bucket))) {
    cacheHit = false;
    const fetched = await deps.fetchFromGoogle(q);
    await deps.upsertPlaces(fetched);
    await deps.touchCell(freshnessKey, bucket, fetched.length);
  }

  const places = await deps.queryNearby(q);
  return { query: q, cellId, radiusBucket: bucket, cacheHit, places };
}
