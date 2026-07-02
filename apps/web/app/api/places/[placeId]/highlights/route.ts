import { NextResponse, type NextRequest } from "next/server";
import { runHighlights } from "@/lib/server/backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** AI öne çıkan özellikler (Claude Haiku). Anthropic anahtarı yoksa 502 döner.
 *  Not: highlights özelliği şu an ertelenmiş (kredi gelince aktif). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ placeId: string }> },
) {
  const { placeId } = await params;
  if (!placeId) {
    return NextResponse.json({ error: "place_id gerekli" }, { status: 400 });
  }
  try {
    return NextResponse.json(await runHighlights(placeId));
  } catch (err) {
    return NextResponse.json(
      { error: "upstream_error", message: (err as Error).message },
      { status: 502 },
    );
  }
}
