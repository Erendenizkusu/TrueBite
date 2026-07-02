import { NextResponse, type NextRequest } from "next/server";
import { grant } from "@/lib/server/backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIdOf(req: NextRequest): string | null {
  const cid = req.headers.get("x-client-id");
  if (cid && cid.trim()) return cid.trim();
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || null;
}

/** Reklam izleme → +istek hakkı (backend /quota/grant çekirdeği).
 *  ⚠️ STUB: gerçek reklam doğrulaması (AdMob SSV / web display) gelene kadar geçici. */
export async function POST(req: NextRequest) {
  const clientId = clientIdOf(req);
  if (!clientId) {
    return NextResponse.json({ error: "client_id_required" }, { status: 400 });
  }
  try {
    const g = await grant(clientId);
    return NextResponse.json({ granted: g.granted, grants: g.grants });
  } catch (err) {
    return NextResponse.json(
      { error: "upstream_error", message: (err as Error).message },
      { status: 502 },
    );
  }
}
