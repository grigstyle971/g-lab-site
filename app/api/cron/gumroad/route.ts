import { timingSafeEqual } from "node:crypto";
import { processDueGumroadPings } from "../../../../lib/account/gumroad-pings";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const configured = process.env.CRON_SECRET;
  const received = request.headers.get("authorization") || "";
  const expected = configured ? `Bearer ${configured}` : "";
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return Boolean(configured && a.length === b.length && timingSafeEqual(a, b));
}

export async function GET(request: Request) {
  if (!authorized(request)) return new Response("Not found", { status: 404 });

  try {
    const result = await processDueGumroadPings(10, request);
    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "reconciliation_failed" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
