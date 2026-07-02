import { NextResponse, type NextRequest } from "next/server";
import { getNearby, type Quota } from "@/lib/api";

/** Kota header'larını yanıta iliştir (tarayıcı kalan hakkı okur). */
function quotaHeaders(q: Quota): Headers {
  const h = new Headers();
  if (q.remaining != null) h.set("X-Quota-Remaining", String(q.remaining));
  if (q.limit != null) h.set("X-Quota-Limit", String(q.limit));
  return h;
}

/** İstemci (TanStack Query) için backend proxy'si — CORS'tan kaçınır, API anahtarlarını
 *  sunucuda tutar. Cihaz kimliğini (X-Client-Id) ve kota durumunu şeffaf geçirir. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = Number(sp.get("lat"));
  const lng = Number(sp.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat/lng gerekli" }, { status: 400 });
  }

  const clientId = req.headers.get("x-client-id") ?? undefined;
  const resp = await getNearby(
    {
      lat,
      lng,
      radiusM: Number(sp.get("radiusM")) || 2000,
      limit: Number(sp.get("limit")) || 30,
      category: sp.get("category"),
    },
    clientId,
  );

  // Kota doldu → 429 (maliyet güvenliği). UI "reklam izle/yarın" ekranı gösterir.
  if (resp.kind === "quota") {
    return NextResponse.json(
      { error: "quota_exceeded", reason: "watch_ad", remaining: 0, limit: resp.quota.limit },
      { status: 429, headers: quotaHeaders(resp.quota) },
    );
  }
  // Backend ulaşılamaz/hata → 502 (istemcide "sonuç yok" ile karışmasın).
  if (resp.kind === "error") {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
  return NextResponse.json(resp.result, { headers: quotaHeaders(resp.quota) });
}
