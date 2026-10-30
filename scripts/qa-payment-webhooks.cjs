const fs = require("fs"),
  assert = require("node:assert/strict"),
  ts = require("typescript"),
  Module = require("module"),
  Stripe = require("stripe");
require.extensions[".ts"] = (m, f) =>
  m._compile(
    ts.transpileModule(fs.readFileSync(f, "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }).outputText,
    f,
  );
const stripe = new Stripe("sk_test_local_fixture");
let calls = [],
  failDb = false;
const original = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "server-only") return {};
  if (request.endsWith("/account/server"))
    return {
      adminClient: () => ({
        rpc: async (name, args) => {
          calls.push({ name, args });
          return { error: failDb ? new Error("db offline") : null };
        },
      }),
    };
  if (request.endsWith("/account/stripe"))
    return { stripeClient: () => stripe };
  return original.apply(this, arguments);
};
process.env.STRIPE_SECRET_KEY = "sk_test_local_fixture";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_local_fixture";
process.env.SUPABASE_SECRET_KEY = "local-fixture";
process.env.STRIPE_LIVE_MODE = "false";
process.env.PRODAMUS_ENABLED = "true";
process.env.PRODAMUS_SECRET_KEY = "local-fixture";
process.env.PRODAMUS_FORM_URL = "https://fixture.payform.ru/";
process.env.PRODAMUS_SYS = "fixture";
const stripeRoute = require("../app/api/webhooks/stripe/route.ts"),
  prodamusRoute = require("../app/api/webhooks/prodamus/route.ts"),
  { signProdamus, formFields } = require("../lib/account/prodamus.ts");
const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
async function stripeRequest(mod = {}, valid = true) {
  const event = {
    id: "evt_fixture",
    object: "event",
    type: "checkout.session.completed",
    livemode: false,
    data: {
      object: {
        id: "cs_fixture",
        object: "checkout.session",
        mode: "payment",
        payment_status: "paid",
        client_reference_id: id,
        metadata: { course_id: "build-with-codex", order_id: id },
        amount_total: 4900,
        currency: "usd",
        payment_intent: "pi_fixture",
        ...mod,
      },
    },
  };
  const payload = JSON.stringify(event);
  const sign = valid
    ? stripe.webhooks.generateTestHeaderString({
        payload,
        secret: process.env.STRIPE_WEBHOOK_SECRET,
      })
    : "bad";
  return stripeRoute.POST(
    new Request("https://site.test/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": sign },
      body: payload,
    }),
  );
}
const p = {
  order_num: id,
  order_id: "12345",
  domain: "fixture.payform.ru",
  sum: "3900.00",
  sys: "fixture",
  payment_status: "success",
  products: [{ name: "Курс", price: "3900.00", quantity: "1" }],
};
async function prodRequest(mod = {}, valid = true, form = false) {
  const data = { ...p, ...mod };
  return prodamusRoute.POST(
    new Request("https://site.test/api/webhooks/prodamus", {
      method: "POST",
      headers: {
        "content-type": form
          ? "application/x-www-form-urlencoded"
          : "application/json",
        sign: valid
          ? signProdamus(data, process.env.PRODAMUS_SECRET_KEY)
          : "bad",
      },
      body: form ? formFields(data) : JSON.stringify(data),
    }),
  );
}
(async () => {
  assert.equal((await stripeRequest({}, false)).status, 400);
  assert.equal(calls.length, 0);
  assert.equal((await stripeRequest({ payment_status: "unpaid" })).status, 200);
  assert.equal(calls.length, 0);
  assert.equal((await stripeRequest({ amount_total: 1 })).status, 400);
  assert.equal((await stripeRequest({ currency: "rub" })).status, 400);
  assert.equal((await stripeRequest()).status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].args.p_order_id, id);
  assert.equal(calls[0].args.p_payment_id, "cs_fixture");
  failDb = true;
  assert.equal((await stripeRequest()).status, 500);
  failDb = false;
  calls = [];
  assert.equal((await prodRequest({}, false)).status, 400);
  assert.equal((await prodRequest({ sum: "1.00" })).status, 400);
  assert.equal((await prodRequest({ domain: "other.payform.ru" })).status, 400);
  assert.equal((await prodRequest({ demo_mode: "1" })).status, 400);
  assert.equal(
    (await prodRequest({ payment_status: "order_canceled" })).status,
    200,
  );
  assert.equal(calls.length, 0);
  assert.equal((await prodRequest()).status, 200);
  assert.equal(calls[0].args.p_order_id, id);
  assert.equal(calls[0].args.p_payment_id, "12345");
  assert.equal((await prodRequest({}, true, true)).status, 200);
  failDb = true;
  assert.equal((await prodRequest()).status, 500);
  console.log(
    "PASS: signed Stripe and Prodamus JSON/form notifications, unpaid/tampered/wrong currency/amount/source/demo rejection, correct order binding and database retry responses.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
