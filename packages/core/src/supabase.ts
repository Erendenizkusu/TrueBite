import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  categoryByKey,
  EXCLUDED_PRIMARY_TYPES,
  EXCLUDED_TYPES,
  SPECIFIC_PRIMARY_TYPES,
} from "@truebite/shared";
import type { NearbyQuery, Place, ScoredPlace, HighlightTag } from "@truebite/shared";

export function createSupabase(url: string, serviceKey: string): SupabaseClient {
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/** Grid hücresi 3 gün içinde dolduruldu mu? (is_cell_fresh SQL fonksiyonu) */
export async function isCellFresh(
  sb: SupabaseClient,
  cellId: string,
  bucket: number,
): Promise<boolean> {
  const { data, error } = await sb.rpc("is_cell_fresh", {
    p_cell_id: cellId,
    p_radius_bucket: bucket,
  });
  if (error) throw new Error(`is_cell_fresh: ${error.message}`);
  return data === true;
}

/** Çekirdek: yarıçap + RealScore sıralaması (nearby_places SQL fonksiyonu). */
export async function queryNearby(sb: SupabaseClient, q: NearbyQuery): Promise<ScoredPlace[]> {
  const cat = categoryByKey(q.category);
  const { data, error } = await sb.rpc("nearby_places", {
    p_lat: q.lat,
    p_lng: q.lng,
    p_radius_m: q.radiusM,
    p_limit: q.limit,
    // Kategori "Tümü" ise tür kısıtı yok (null); aksi halde alakalı türlerle kesişim.
    p_types: cat.relevantTypes,
    // Bar/sahne/etkinlik mekânlarını daima ele (primaryType bazlı).
    p_excluded_primaries: EXCLUDED_PRIMARY_TYPES,
    // Güçlü gece-hayatı sinyali (types bazlı) → primary restaurant olsa bile ele.
    p_excluded_types: EXCLUDED_TYPES,
    // Cross-kategori kapısı: primary başka bir spesifik işletme türüyse ele (kafe→sushi).
    p_specific_primaries: SPECIFIC_PRIMARY_TYPES,
    // Kahve/tatlı: primary doğrudan kategori türü olmalı (generic restoran kabul edilmez).
    p_strict_primary: cat.strictPrimary === true,
  });
  if (error) throw new Error(`nearby_places: ${error.message}`);
  return (data ?? []).map(
    (r: any): ScoredPlace => ({
      placeId: r.place_id,
      name: r.name,
      formattedAddress: null,
      lat: r.lat,
      lng: r.lng,
      rating: r.rating,
      userRatingsTotal: r.user_ratings_total,
      priceLevel: null,
      primaryType: null,
      types: [],
      businessStatus: null,
      distanceM: r.distance_m,
      realScore: r.real_score,
    }),
  );
}

/** Normalize mekanları places'e yazar (camelCase → snake_case). */
export async function upsertPlaces(sb: SupabaseClient, places: Place[]): Promise<number> {
  if (places.length === 0) return 0;
  const payload = places.map((p) => ({
    place_id: p.placeId,
    name: p.name,
    formatted_address: p.formattedAddress,
    lat: p.lat,
    lng: p.lng,
    rating: p.rating,
    user_ratings_total: p.userRatingsTotal,
    price_level: p.priceLevel,
    primary_type: p.primaryType,
    types: p.types,
    business_status: p.businessStatus,
  }));
  const { data, error } = await sb.rpc("upsert_places", { p_places: payload });
  if (error) throw new Error(`upsert_places: ${error.message}`);
  return (data as number) ?? 0;
}

/** Grid hücresinin önbellek zaman damgasını tazeler. */
export async function touchCell(
  sb: SupabaseClient,
  cellId: string,
  bucket: number,
  count: number,
): Promise<void> {
  const { error } = await sb.rpc("touch_cell", {
    p_cell_id: cellId,
    p_radius_bucket: bucket,
    p_place_count: count,
  });
  if (error) throw new Error(`touch_cell: ${error.message}`);
}

/** Taze AI etiketleri (yoksa/bayatsa null). */
export async function freshHighlights(
  sb: SupabaseClient,
  placeId: string,
): Promise<HighlightTag[] | null> {
  const { data, error } = await sb.rpc("fresh_highlights", { p_place_id: placeId });
  if (error) throw new Error(`fresh_highlights: ${error.message}`);
  return (data as HighlightTag[] | null) ?? null;
}

/** AI etiketlerini önbelleğe yazar. */
export async function upsertHighlights(
  sb: SupabaseClient,
  placeId: string,
  tags: HighlightTag[],
  count: number,
  model: string,
): Promise<void> {
  const { error } = await sb.rpc("upsert_highlights", {
    p_place_id: placeId,
    p_tags: tags,
    p_count: count,
    p_model: model,
  });
  if (error) throw new Error(`upsert_highlights: ${error.message}`);
}
