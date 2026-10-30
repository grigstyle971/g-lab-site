import { timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import { enqueueGumroadPing, processGumroadPingAfterAcknowledgement, type GumroadPingResource } from "../../../../../lib/account/gumroad-pings";
import { gumroadWebhookConfigured } from "../../../../../lib/account/config";

export const runtime = "nodejs";
export const maxDuration = 60;

function matchesSecret(received: string, expected: string) {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function singleField(fields: URLSearchParams, name: string) {
  const values = fields.getAll(name);
  return values.length === 1 ? values[0] : null;
}

async function readFormBody(request: Request, maxBytes: number) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes)
    return { body: null, tooLarge: true };

  const reader = request.body?.getReader();
  if (!reader) return { body: "", tooLarge: false };

  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return { body: null, tooLarge: true };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { body: new TextDecoder("utf-8", { fatal: true }).decode(bytes), tooLarge: false };
  } catch {
    return { body: null, tooLarge: false };
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ secret: string }> },
) {
  const { secret } = await context.params;
  const configuredSecret = process.env.GUMROAD_PING_SECRET;
  if (
    !configuredSecret ||
    !matchesSecret(secret, configuredSecret) ||
    !gumroadWebhookConfigured()
  )
    return new Response("Not found", { status: 404 });

  const contentType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (contentType !== "application/x-www-form-urlencoded")
    return new Response("Invalid content type", { status: 400 });

  const { body, tooLarge } = await readFormBody(request, 65536);
  if (tooLarge) return new Response("Too large", { status: 413 });
  if (body === null) return new Response("Invalid form encoding", { status: 400 });

  const fields = new URLSearchParams(body);
  if (["true", "1"].includes((singleField(fields, "test") || "").toLowerCase()))
    return new Response("Test ping acknowledged");

  const saleId = singleField(fields, "sale_id");
  const resource = singleField(fields, "resource_name");
  if (
    !saleId ||
    saleId.length > 180 ||
    !/^[A-Za-z0-9_+./=-]+$/.test(saleId) ||
    !resource
  )
    return new Response("Invalid ping", { status: 400 });
  if (!["sale", "refund", "dispute"].includes(resource))
    return new Response("Event ignored");

  try {
    const event = resource as GumroadPingResource;
    await enqueueGumroadPing(saleId, event);

    // The durable queue is written before acknowledgement. Gumroad's Ping
    // endpoint has a five-second deadline; reconcile after the 2xx response.
    after(async () => {
      try {
        await processGumroadPingAfterAcknowledgement(saleId, event, request);
      } catch {
        // The queued event remains due for the scheduled reconciliation route.
      }
    });

    return new Response("Ping queued", { status: 202 });
  } catch {
    // No 2xx until the event is durable, so Gumroad will retry this failure.
    return new Response("Could not queue ping", { status: 503 });
  }
}
