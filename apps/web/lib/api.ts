import type { NearbyResult } from "@truebite/shared";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8787";

export interface NearbyParams {
  lat: number;
  lng: number;
  radiusM?: number;
  limit?: number;
  category?: string | null;
}

/** Backend'in /places/nearby endpoint'ini tüketir. Hata/boş durumda null döner
 *  (UI boş-durum ekranı gösterir). Sunucu tarafında çağrılır (SEO/SSR). */
export async function getNearby(p: NearbyParams): Promise<NearbyResult | null> {
  const qs = new URLSearchParams({
    lat: String(p.lat),
    lng: String(p.lng),
    radiusM: String(p.radiusM ?? 2000),
    limit: String(p.limit ?? 30),
  });
  if (p.category) qs.set("category", p.category);

  try {
    const res = await fetch(`${API_BASE}/places/nearby?${qs.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as NearbyResult;
  } catch {
    return null;
  }
}
