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
    type: sp.get("type"),
  });
  return NextResponse.json(result);
}
