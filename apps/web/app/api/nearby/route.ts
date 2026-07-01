import { NextResponse, type NextRequest } from "next/server";
import { getNearby } from "@/lib/api";

/** İstemci (TanStack Query) için backend proxy'si — CORS'tan kaçınır,
 *  API anahtarlarını sunucuda tutar. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = Number(sp.get("lat"));
  const lng = Number(sp.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat/lng gerekli" }, { status: 400 });
  }
  const result = await getNearby({
    lat,
    lng,
    radiusM: Number(sp.get("radiusM")) || 2000,
    limit: Number(sp.get("limit")) || 30,
    category: sp.get("category"),
  });
  // getNearby, backend ulaşılamaz/hata olduğunda null döner. Bunu 200+null olarak geçirmek
  // istemcide "sonuç yok" ile karışıyordu → upstream hatasını 502 ile ayır.
  if (!result) {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
  return NextResponse.json(result);
}
