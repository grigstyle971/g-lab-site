import { adminClient } from "../../../../lib/account/server";
import { livePaymentsEnabled, PRICES } from "../../../../lib/account/config";
import {
  moneyToMinor,
  parseProdamusFields,
  validProdamusUrl,
  verifyProdamus,
  type SignedValue,
} from "../../../../lib/account/prodamus";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (
    process.env.PRODAMUS_ENABLED !== "true" ||
    !livePaymentsEnabled() ||
    !process.env.PRODAMUS_SECRET_KEY ||
    !process.env.PRODAMUS_FORM_URL ||
    !process.env.SUPABASE_SECRET_KEY
  )
    return new Response("Unavailable", { status: 503 });
  const signature = request.headers.get("sign") || "";
  const raw = await request.text();
  if (raw.length > 131072) return new Response("Too large", { status: 413 });
  let data: Record<string, SignedValue>;
  try {
    if (request.headers.get("content-type")?.includes("application/json")) {
      data = JSON.parse(raw);
      if (!data || Array.isArray(data) || typeof data !== "object")
        throw new Error("Invalid body");
    } else {
      const parsed = new Request(request.url, {
        method: "POST",
        headers: {
          "content-type":
            request.headers.get("content-type") ||
            "application/x-www-form-urlencoded",
        },
        body: raw,
      });
      data = parseProdamusFields((await parsed.formData()).entries());
    }
    if (!verifyProdamus(data, signature, process.env.PRODAMUS_SECRET_KEY))
      return new Response("Invalid signature", { status: 400 });
    if (
      data.domain !==
        validProdamusUrl(process.env.PRODAMUS_FORM_URL).hostname ||
      data.sys !== process.env.PRODAMUS_SYS ||
      (data.currency && data.currency !== "rub") ||
      (data.demo_mode && data.demo_mode !== "0" && data.demo_mode !== 0)
    )
      return new Response("Wrong payment source", { status: 400 });
    if (data.payment_status !== "success") return new Response("Not paid");
    // Prodamus order_num is OUR order ID; order_id is Prodamus's payment ID.
    if (
      typeof data.order_num !== "string" ||
      !/^[a-f0-9-]{36}$/i.test(data.order_num) ||
      typeof data.order_id !== "string" ||
      !/^\d+$/.test(data.order_id)
    )
      return new Response("Invalid order", { status: 400 });
    const amount = moneyToMinor(String(data.sum));
    if (amount !== PRICES.prodamus.amount)
      return new Response("Wrong amount", { status: 400 });
  } catch {
    return new Response("Invalid body", { status: 400 });
  }
  try {
    const { error } = await adminClient().rpc("fulfill_course_order", {
      p_order_id: data.order_num,
      p_provider: "prodamus",
      p_payment_id: String(data.order_id),
      p_event_id: `payment-${data.order_id}-success`,
      p_amount: PRICES.prodamus.amount,
      p_currency: "rub",
      p_charge_id: String(data.order_id),
    });
    if (error) throw error;
    return new Response("success");
  } catch {
    return new Response("Retry later", { status: 500 });
  }
}
