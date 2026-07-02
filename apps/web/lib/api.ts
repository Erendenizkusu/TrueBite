import type { NearbyResult } from "@truebite/shared";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8787";

export interface NearbyParams {
  lat: number;
  lng: number;
  radiusM?: number;
  limit?: number;
  category?: string | null;
}

/** Maliyet güvenliği kotası (RELEASE.md § A) — sunucudan header ile gelir. */
export interface Quota {
  remaining: number | null;
  limit: number | null;
}

/** getNearby dönüşü — 429 (kota) ile gerçek hata ayrıştırılır ki UI doğru ekranı göstersin. */
export type NearbyResponse =
  | { kind: "ok"; result: NearbyResult; quota: Quota }
  | { kind: "quota"; quota: Quota }
  | { kind: "error"; status: number };

function numOrNull(v: string | null): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Backend'in /places/nearby endpoint'ini tüketir (sunucu tarafı proxy). Cihaz kimliğini
 * (X-Client-Id) iletir; kota başlıklarını okur. 429 → kota doldu (ayrı ekran), diğer !ok → hata.
 */
export async function getNearby(p: NearbyParams, clientId?: string): Promise<NearbyResponse> {
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
      headers: clientId ? { "X-Client-Id": clientId } : undefined,
    });
    const quota: Quota = {
      remaining: numOrNull(res.headers.get("x-quota-remaining")),
      limit: numOrNull(res.headers.get("x-quota-limit")),
    };
    if (res.status === 429) return { kind: "quota", quota };
    if (!res.ok) return { kind: "error", status: res.status };
    return { kind: "ok", result: (await res.json()) as NearbyResult, quota };
  } catch {
    return { kind: "error", status: 0 };
  }
}

/**
 * Reklam izleme karşılığı +istek hakkı ister (backend /quota/grant).
 * ⚠️ STUB: gerçek reklam entegrasyonuna (web display / mobil AdMob SSV) kadar geçicidir.
 */
export async function grantQuota(clientId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/quota/grant`, {
      method: "POST",
      headers: { "X-Client-Id": clientId, "Content-Type": "application/json" },
      body: "{}",
    });
    return res.ok;
  } catch {
    return false;
  }
}
