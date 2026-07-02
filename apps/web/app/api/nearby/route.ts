import { NextResponse, type NextRequest } from "next/server";
import { nearbyQuerySchema } from "@truebite/shared";
import { checkQuota, runNearby } from "@/lib/server/backend";

// Supabase/Google çağrıları → Node runtime (Edge değil) + her istekte taze (cache yok).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cihaz kimliği: X-Client-Id başlığı → yoksa forwarded IP (anonim kota temeli). */
function clientIdOf(req: NextRequest): string {
  const cid = req.headers.get("x-client-id");
  if (cid && cid.trim()) return cid.trim();
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0]?.trim()) || "unknown";
}

/**
 * TrueBite backend'i (Vercel serverless). Fastify ile aynı çekirdek (@truebite/core).
 * Akış: kota kapısı → nearby (cache + bütçe kapısı içeride). Kota header'da döner.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const parsed = nearbyQuerySchema.safeParse({
    lat: sp.get("lat") ?? undefined,
    lng: sp.get("lng") ?? undefined,
    radiusM: sp.get("radiusM") ?? undefined,
    limit: sp.get("limit") ?? undefined,
    category: sp.get("category"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_query", details: parsed.error.flatten() }, { status: 400 });
  }

  // Maliyet güvenliği: cihaz-başı günlük kota (RELEASE.md § A).
  const clientId = clientIdOf(req);
  const quota = await checkQuota(clientId);
  const headers = new Headers({
    "X-Quota-Limit": String(quota.limit),
    "X-Quota-Remaining": String(quota.remaining),
  });
  if (!quota.allowed) {
    return NextResponse.json(
      { error: "quota_exceeded", reason: "watch_ad", limit: quota.limit, remaining: 0 },
      { status: 429, headers },
    );
  }

  try {
    const result = await runNearby(parsed.data);
    return NextResponse.json(result, { headers });
  } catch (err) {
    return NextResponse.json(
      { error: "upstream_error", message: (err as Error).message },
      { status: 502 },
    );
  }
}
