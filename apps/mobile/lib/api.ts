import type { NearbyResult } from "@truebite/shared";

// Cihaz/emülatör dev makineye localhost ile erişemez.
//   - Android emülatör: http://10.0.2.2:8787
//   - Fiziksel cihaz:   http://<dev-makine-LAN-IP>:8787
// .env içinde EXPO_PUBLIC_API_BASE_URL ile ayarla.
const BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8787";

/** Backend'in /places/nearby endpoint'ini tüketir. Konum-bağımsız: hangi lat/lng
 *  verilirse o bölgeyi sorgular (Kadıköy, Rotterdam, herhangi bir yer). */
export async function fetchNearby(
  lat: number,
  lng: number,
  radiusM = 2000,
  category?: string | null,
): Promise<NearbyResult | null> {
  const qs = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radiusM: String(radiusM),
    limit: "12",
  });
  if (category && category !== "all") qs.set("category", category);
  try {
    const res = await fetch(`${BASE}/places/nearby?${qs.toString()}`);
    if (!res.ok) return null;
    return (await res.json()) as NearbyResult;
  } catch {
    return null;
  }
}
