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
  // Maliyet güvenliği: cache-miss'te Google'a GİTMEDEN önce global bütçe tavanını dener.
  // false → tavan doldu, Google çağrısı yapılmaz, bayat/DB verisi servis edilir.
  tryConsumeBudget: (calls: number) => Promise<boolean>;
  // Bir cache-miss'in yapacağı gerçek Google çağrı sayısı (bütçeden düşülecek miktar).
  googleCallsPerFetch: number;
  // Opsiyonel: AI kategori-uyum katmanı (RealScore sonrası yeniden sıralama). Verilmezse
  // (ya da CATEGORY_FIT_TOP_N=0 ise) atlanır — nearby davranışı bugünküyle aynı kalır.
  refineByCategoryFit?: (places: ScoredPlace[], q: NearbyQuery) => Promise<ScoredPlace[]>;
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
  // Kategori önbellek kimliğine katılır → her kategori kendi tazeliğine sahip
  // (örn. "kahve" araması, daha önce "tümü" cache'lense bile Google'a taze gider).
  const freshnessKey = q.category ? `${cellId}:${q.category}` : cellId;

  let cacheHit = true;
  let budgetExceeded = false;
  if (!(await deps.isCellFresh(freshnessKey, bucket))) {
    cacheHit = false;
    // Maliyet güvenliği: global bütçe tavanı dolmadıysa taze çek; dolduysa Google'a
    // GİTME — elde ne varsa (bayat/kısmi DB verisi) servis et (altın kural).
    if (await deps.tryConsumeBudget(deps.googleCallsPerFetch)) {
      const fetched = await deps.fetchFromGoogle(q);
      await deps.upsertPlaces(fetched);
      await deps.touchCell(freshnessKey, bucket, fetched.length);
    } else {
      budgetExceeded = true;
    }
  }

  let places = await deps.queryNearby(q);
  // AI kategori-uyum katmanı (opsiyonel + savunmacı): asıl işi kategori olmayan mekânları
  // yorum-analiziyle aşağı çeker. Hata olursa RealScore sıralamasına zarifçe düşer.
  if (deps.refineByCategoryFit) {
    try {
      places = await deps.refineByCategoryFit(places, q);
    } catch {
      /* fit katmanı asla nearby'yi kırmaz — RealScore sırası korunur */
    }
  }
  return { query: q, cellId, radiusBucket: bucket, cacheHit, budgetExceeded, places };
}
