const fs = require("fs"),
  assert = require("node:assert/strict"),
  ts = require("typescript");
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
const { PGlite } = require("@electric-sql/pglite");
const {
  signProdamus,
  verifyProdamus,
  moneyToMinor,
  parseProdamusFields,
  validProdamusUrl,
} = require("../lib/account/prodamus.ts");
const { safeNext } = require("../lib/account/config.ts");
(async () => {
  assert.equal(safeNext("//evil.example"), "\/account");
  assert.equal(safeNext("/account\\evil"), "\/account");
  assert.equal(safeNext("https://evil.example", "ru"), "/ru/account");
  assert.equal(safeNext("/ru/course-checkout", "ru"), "/ru/course-checkout");
  assert.equal(moneyToMinor("3900.00"), 390000);
  assert.equal(moneyToMinor("3900.001"), null);
  assert.equal(moneyToMinor("-3900"), null);
  assert.throws(() => validProdamusUrl("https://payform.ru.evil.example/"));
  const payload = {
      z: "https://example.test/путь",
      a: [{ quantity: 1, name: "Курс" }],
    },
    secret = "local-test-only";
  const expected = require("node:crypto")
    .createHmac("sha256", secret)
    .update(
      '{"a":[{"name":"Курс","quantity":"1"}],"z":"https:\\/\\/example.test\\/путь"}',
    )
    .digest("hex");
  assert.equal(signProdamus(payload, secret), expected);
  assert(verifyProdamus(payload, expected, secret));
  assert(!verifyProdamus({ ...payload, z: "changed" }, expected, secret));
  assert(!verifyProdamus(payload, "x", secret));
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        parseProdamusFields([
          ["products[0][name]", "Курс"],
          ["sum", "3900.00"],
        ]),
      ),
    ),
    { products: [{ name: "Курс" }], sum: "3900.00" },
  );
  assert.throws(() => parseProdamusFields([["__proto__[x]", "bad"]]));
  assert.throws(() =>
    parseProdamusFields([
      ["sum", "1"],
      ["sum", "2"],
    ]),
  );
  const db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';grant usage on schema auth,public to anon,authenticated,service_role;`,
  );
  await db.exec(
    fs.readFileSync(
      "supabase/migrations/202609050001_course_accounts.sql",
      "utf8",
    ),
  );
  const a = "11111111-1111-4111-8111-111111111111",
    b = "22222222-2222-4222-8222-222222222222",
    order = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    second = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  await db.query("insert into auth.users(id) values($1),($2)", [a, b]);
  await db.query(
    "insert into course_orders(id,user_id,course_id,provider,amount,currency) values($1,$2,'build-with-codex','stripe',4900,'usd')",
    [order, a],
  );
  async function fail(sql, params = []) {
    await assert.rejects(() => db.query(sql, params));
  }
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [b]);
  assert.equal((await db.query("select * from course_orders")).rows.length, 0);
  await fail(
    "insert into course_enrollments(user_id,course_id) values($1,'build-with-codex')",
    [b],
  );
  await fail(
    "select fulfill_course_order($1,'stripe','cs_test','evt_1',4900,'usd','pi_test')",
    [order],
  );
  await fail(
    "insert into course_progress(user_id,lesson_slug) values($1,'github-account')",
    [b],
  );
  await fail(
    "insert into course_progress(user_id,lesson_slug) values($1,'welcome')",
    [b],
  );
  await fail(
    "insert into course_progress(user_id,lesson_slug) values($1,'welcome')",
    [a],
  );
  await db.exec("reset role;set role service_role");
  await fail(
    "select fulfill_course_order($1,'stripe','cs_test','evt_1',1,'usd','pi_test')",
    [order],
  );
  await fail(
    "select fulfill_course_order($1,'prodamus','cs_test','evt_1',4900,'usd','pi_test')",
    [order],
  );
  await db.query(
    "select fulfill_course_order($1,'stripe','cs_test','evt_1',4900,'usd','pi_test')",
    [order],
  );
  await db.query(
    "select fulfill_course_order($1,'stripe','cs_test','evt_1',4900,'usd','pi_test')",
    [order],
  );
  assert.equal(
    (await db.query("select * from course_payment_events")).rows.length,
    1,
  );
  assert.equal(
    (await db.query("select * from course_enrollments")).rows.length,
    1,
  );
  await db.query(
    "insert into course_progress(user_id,lesson_slug) values($1,'welcome')",
    [a],
  );
  await fail(
    "select fulfill_course_order($1,'stripe','another-payment','evt_2',4900,'usd','pi_test')",
    [order],
  );
  await db.exec("reset role;set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [a]);
  assert.equal((await db.query("select * from course_orders")).rows.length, 1);
  assert.equal(
    (await db.query("select * from course_enrollments")).rows.length,
    1,
  );
  await db.query(
    "insert into course_progress(user_id,lesson_slug) values($1,'github-account')",
    [a],
  );
  assert.equal(
    (await db.query("select * from course_progress")).rows.length,
    2,
  );
  await db.exec("reset role;set role service_role");
  await db.query("select refund_course_order('stripe','pi_test')");
  assert.equal(
    (await db.query("select active from course_enrollments")).rows[0].active,
    false,
  );
  await fail(
    "select fulfill_course_order($1,'stripe','cs_test','evt_1',4900,'usd','pi_test')",
    [order],
  );
  await db.query(
    "insert into course_orders(id,user_id,course_id,provider,amount,currency) values($1,$2,'build-with-codex','prodamus',390000,'rub')",
    [second, a],
  );
  await db.query(
    "select fulfill_course_order($1,'prodamus','123','payment-123-success',390000,'rub','123')",
    [second],
  );
  await db.query("select refund_course_order('stripe','pi_test')");
  assert.equal(
    (await db.query("select active from course_enrollments")).rows[0].active,
    true,
  );
  await db.exec("reset role;set role anon");
  await fail("select * from course_orders");
  await fail("select * from course_enrollments");
  await db.close();
  console.log(
    "PASS: redirect validation, Prodamus signature/tampering/parser, real SQL RLS, unauthorized grants, amount/provider/reference mismatches, duplicate fulfillment and refunds.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
