import { NextResponse, type NextRequest } from "next/server";
import { grantQuota } from "@/lib/api";

/** Reklam izleme → +istek hakkı proxy'si (backend /quota/grant). Cihaz kimliğini iletir.
 *  ⚠️ STUB: gerçek reklam doğrulaması gelene kadar geçici (bkz. RELEASE.md § A). */
export async function POST(req: NextRequest) {
  const clientId = req.headers.get("x-client-id");
  if (!clientId) {
    return NextResponse.json({ error: "client_id_required" }, { status: 400 });
  }
  const ok = await grantQuota(clientId);
  if (!ok) {
    return NextResponse.json({ error: "grant_failed" }, { status: 502 });
  }
  return NextResponse.json({ granted: true });
}
