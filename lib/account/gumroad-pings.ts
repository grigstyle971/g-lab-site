import "server-only";
import { track } from "@vercel/analytics/server";
import { adminClient } from "./server";
import { GUMROAD_COURSE_PERMALINK, PRICES } from "./config";

export type GumroadPingResource = "sale" | "refund" | "dispute";

type GumroadSale = {
  id: string;
  product_id: string;
  product_permalink?: string;
  email?: string;
  purchase_email?: string;
  price: number;
  currency: string;
  paid: boolean;
  refunded?: boolean;
  access_revoked?: boolean;
  partially_refunded?: boolean;
  refunded_cents?: number;
  chargedback?: boolean;
  disputed?: boolean;
  is_product_physical?: boolean;
  is_recurring_billing?: boolean;
  has_variants?: boolean;
  quantity?: number;
  buyer_presentment?: {
    currency?: string;
    refunded_cents?: number;
    total_cents?: number;
  };
};

class RetryableGumroadError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

function saleIsRevoked(sale: GumroadSale) {
  const refunded = Math.max(
    Number(sale.refunded_cents) || 0,
    Number(sale.buyer_presentment?.refunded_cents) || 0,
  );
  return Boolean(
    sale.access_revoked ||
      sale.refunded ||
      sale.partially_refunded ||
      refunded > 0 ||
      sale.chargedback ||
      sale.disputed,
  );
}

async function getVerifiedSale(saleId: string): Promise<GumroadSale | null> {
  const url = new URL(
    `https://api.gumroad.com/v2/sales/${encodeURIComponent(saleId)}`,
  );
  url.searchParams.set("access_token", process.env.GUMROAD_ACCESS_TOKEN!);
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(3000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new RetryableGumroadError("gumroad_api_error");
  const result = (await response.json()) as {
    success?: boolean;
    sale?: GumroadSale;
  };
  if (!result.success || !result.sale) return null;
  return result.sale;
}

export async function enqueueGumroadPing(
  saleId: string,
  resource: GumroadPingResource,
) {
  const { error } = await adminClient()
    .from("gumroad_ping_queue")
    .upsert(
      { sale_id: saleId, resource_name: resource },
      { onConflict: "sale_id,resource_name", ignoreDuplicates: true },
    )
    .abortSignal(AbortSignal.timeout(2500));
  if (error) throw error;
}

async function reconcileGumroadPing(
  saleId: string,
  resource: GumroadPingResource,
  request?: Request,
) {
  const sale = await getVerifiedSale(saleId);
  if (!sale) throw new RetryableGumroadError("sale_not_available");
  if (sale.id !== saleId) throw new RetryableGumroadError("sale_id_mismatch");

  // Gumroad's permalink identifies this specific course across price changes.
  if (!sale.product_permalink)
    throw new RetryableGumroadError("sale_product_identity_missing");
  if (sale.product_permalink !== GUMROAD_COURSE_PERMALINK) return false;

  const db = adminClient();
  const revoked = saleIsRevoked(sale);
  if (resource === "refund" || resource === "dispute" || revoked) {
    if (!revoked) throw new RetryableGumroadError("revocation_not_visible_yet");
    const { error } = await db.rpc("process_gumroad_revocation_ping", {
      p_sale_id: saleId,
      p_resource: resource,
    });
    if (error) throw new RetryableGumroadError("access_revocation_failed");
    return true;
  }

  if (!sale.paid) throw new RetryableGumroadError("sale_not_paid_yet");
  const saleCurrency = sale.currency?.toLowerCase();
  if (
    !Number.isSafeInteger(sale.price) ||
    sale.price <= 0 ||
    saleCurrency !== PRICES.gumroad.currency ||
    sale.is_product_physical === true ||
    sale.is_recurring_billing === true ||
    sale.has_variants === true ||
    (sale.quantity !== undefined && sale.quantity !== 1)
  )
    throw new RetryableGumroadError("sale_does_not_match_course");

  const email = sale.purchase_email || sale.email;
  if (!email || (sale.email && sale.email.toLowerCase() !== email.toLowerCase()))
    throw new RetryableGumroadError("sale_email_not_ready");

  const { error } = await db.rpc("fulfill_gumroad_course_order", {
    p_sale_id: saleId,
    p_event_id: `${resource}:${saleId}`,
    p_buyer_email: email,
    p_amount: sale.price,
    // Gumroad keeps the product price in its canonical currency even when
    // the buyer's one-time card charge uses a verified local presentment.
    p_currency: PRICES.gumroad.currency,
  });
  if (error) throw new RetryableGumroadError("course_fulfillment_failed");
  if (request) {
    try {
      await track("course_purchase_verified", {
        provider: "gumroad",
        product: "build-with-codex",
        amount_cents: sale.price,
        currency: PRICES.gumroad.currency,
      }, { request: { headers: request.headers } });
    } catch {
      // Analytics must never delay course access or Gumroad Ping acknowledgement.
    }
  }
  return true;
}

export async function processGumroadPing(
  saleId: string,
  resource: GumroadPingResource,
  request?: Request,
) {
  const db = adminClient();
  const { data: ping, error: lookupError } = await db
    .from("gumroad_ping_queue")
    .select("status,attempt_count")
    .eq("sale_id", saleId)
    .eq("resource_name", resource)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (!ping || ping.status !== "queued") return;

  try {
    const matchedCourse = await reconcileGumroadPing(saleId, resource, request);
    const { error } = await db
      .from("gumroad_ping_queue")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
        last_error: matchedCourse ? null : "ignored_other_product",
      })
      .eq("sale_id", saleId)
      .eq("resource_name", resource);
    if (error) throw new RetryableGumroadError("queue_update_failed");
  } catch (error) {
    const attemptCount = ping.attempt_count + 1;
    const delayMs = Math.min(
      24 * 60 * 60 * 1000,
      60_000 * 2 ** Math.min(attemptCount - 1, 10),
    );
    const nextAttemptAt = new Date(Date.now() + delayMs).toISOString();
    const errorCode =
      error instanceof RetryableGumroadError ? error.code : "processing_failed";
    const { error: updateError } = await db
      .from("gumroad_ping_queue")
      .update({
        attempt_count: attemptCount,
        next_attempt_at: nextAttemptAt,
        last_error: errorCode,
      })
      .eq("sale_id", saleId)
      .eq("resource_name", resource);
    if (updateError) throw updateError;
  }
}

export async function processGumroadPingAfterAcknowledgement(
  saleId: string,
  resource: GumroadPingResource,
  request?: Request,
) {
  const retryDelays = [1_000, 3_000, 6_000];

  for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
    if (attempt > 0)
      await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt - 1]));

    await processGumroadPing(saleId, resource, request);

    const { data: ping, error } = await adminClient()
      .from("gumroad_ping_queue")
      .select("status,last_error")
      .eq("sale_id", saleId)
      .eq("resource_name", resource)
      .maybeSingle();

    if (
      error ||
      !ping ||
      ping.status !== "queued" ||
      ping.last_error === "sale_does_not_match_course" ||
      ping.last_error === "sale_id_mismatch"
    )
      return;
  }
}

export async function processDueGumroadPings(limit = 10, request?: Request) {
  const db = adminClient();
  const { data, error } = await db
    .from("gumroad_ping_queue")
    .select("sale_id,resource_name")
    .eq("status", "queued")
    .lte("next_attempt_at", new Date().toISOString())
    .order("received_at", { ascending: true })
    .limit(Math.max(1, Math.min(limit, 25)));
  if (error) throw error;

  for (const ping of data || []) {
    await processGumroadPing(
      ping.sale_id,
      ping.resource_name as GumroadPingResource,
      request,
    );
  }

  return { checked: data?.length || 0 };
}
