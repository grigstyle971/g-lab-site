import type Stripe from "stripe";
import { stripeClient } from "../../../../lib/account/stripe";
import { adminClient } from "../../../../lib/account/server";
import {
  COURSE_ID,
  livePaymentsEnabled,
  PRICES,
  stripeProductionModeReady,
} from "../../../../lib/account/config";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature"),
    secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (
    !secret ||
    !process.env.STRIPE_SECRET_KEY ||
    !process.env.SUPABASE_SECRET_KEY ||
    !livePaymentsEnabled() ||
    !stripeProductionModeReady()
  )
    return new Response("Unavailable", { status: 503 });
  if (!signature) return new Response("Missing signature", { status: 400 });
  const raw = await request.text();
  if (raw.length > 262144) return new Response("Too large", { status: 413 });
  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(raw, signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }
  if (event.livemode !== (process.env.STRIPE_LIVE_MODE === "true"))
    return new Response("Wrong mode", { status: 400 });
  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object;
      if (session.payment_status !== "paid")
        return new Response("Not paid", { status: 200 });
      if (
        session.mode !== "payment" ||
        session.metadata?.course_id !== COURSE_ID ||
        !session.metadata?.order_id ||
        session.client_reference_id !== session.metadata.order_id ||
        session.amount_total !== PRICES.stripe.amount ||
        session.currency !== PRICES.stripe.currency
      )
        return new Response("Order mismatch", { status: 400 });
      const charge =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      const { error } = await adminClient().rpc("fulfill_course_order", {
        p_order_id: session.metadata.order_id,
        p_provider: "stripe",
        p_payment_id: session.id,
        p_event_id: event.id,
        p_amount: session.amount_total,
        p_currency: session.currency,
        p_charge_id: charge ?? null,
      });
      if (error) throw error;
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object;
      if (
        charge.refunded &&
        charge.amount_refunded >= charge.amount &&
        charge.payment_intent
      ) {
        const ref =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent.id;
        const { error } = await adminClient().rpc("refund_course_order", {
          p_provider: "stripe",
          p_charge_id: ref,
        });
        if (error) throw error;
      }
    }
    return new Response("ok");
  } catch {
    return new Response("Retry later", { status: 500 });
  }
}
