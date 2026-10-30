const { PGlite } = require('@electric-sql/pglite');
const fs = require('node:fs');
const assert = require('node:assert/strict');

(async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create schema auth;
      create table auth.users (
        id uuid primary key,
        email text,
        email_confirmed_at timestamptz
      );
      create function auth.uid() returns uuid language sql stable as
        'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
      grant usage on schema auth, public to anon, authenticated, service_role;
      grant all on auth.users to service_role;
    `);
    await db.query(
      "insert into auth.users(id,email,email_confirmed_at) values($1,'grigstyle971@gmail.com',now())",
      ['99999999-9999-4999-8999-999999999999'],
    );

    for (const file of [
      '202609050001_course_accounts.sql',
      '202609060001_manual_course_access.sql',
      '202609060002_owner_access_panel.sql',
      '202609060003_learning_workspace.sql',
      '202609240001_gumroad_course_payments.sql',
      '202609240002_gumroad_pay_after_signup.sql',
    ]) {
      await db.exec(fs.readFileSync(`supabase/migrations/${file}`, 'utf8'));
    }

    const laterUser = '22222222-2222-4222-8222-222222222222';

    async function addSale(saleId, email, resource = 'sale') {
      await db.query(
        'insert into gumroad_ping_queue(sale_id,resource_name) values($1,$2) on conflict do nothing',
        [saleId, resource],
      );
    }
    async function fulfill(saleId, email) {
      return db.query(
        "select fulfill_gumroad_course_order($1,$2,$3,4900,'usd')",
        [saleId, `sale:${saleId}`, email],
      );
    }

    await addSale('sale-before-account', 'buyer@example.com');
    await db.exec('set role service_role');
    await fulfill('sale-before-account', ' BUYER@example.com ');
    await fulfill('sale-before-account', 'buyer@example.com');
    assert.equal(
      (await db.query('select count(*)::int as n from course_orders')).rows[0].n,
      0,
    );
    assert.equal(
      (await db.query('select count(*)::int as n from gumroad_pending_course_purchases')).rows[0].n,
      1,
    );
    await assert.rejects(() =>
      db.query("select claim_gumroad_pending_course_purchases('buyer@example.com')"),
    );

    await db.query(
      "insert into auth.users(id,email,email_confirmed_at) values($1,'buyer@example.com',now())",
      [laterUser],
    );
    assert.equal(
      (await db.query("select claim_gumroad_pending_course_purchases('buyer@example.com') as n")).rows[0].n,
      1,
    );
    assert.equal(
      (await db.query('select status from course_orders where provider_payment_id=$1', ['sale-before-account'])).rows[0].status,
      'paid',
    );
    assert.equal(
      (await db.query('select active from course_enrollments where user_id=$1', [laterUser])).rows[0].active,
      true,
    );
    assert.equal(
      (await db.query("select claim_gumroad_pending_course_purchases('buyer@example.com') as n")).rows[0].n,
      0,
    );
    await fulfill('sale-before-account', 'buyer@example.com');
    assert.equal(
      (await db.query('select count(*)::int as n from course_orders')).rows[0].n,
      1,
    );

    await addSale('sale-refunded-before-account', 'refund@example.com');
    await fulfill('sale-refunded-before-account', 'refund@example.com');
    await addSale('sale-refunded-before-account', 'refund@example.com', 'refund');
    await db.query(
      "select process_gumroad_revocation_ping('sale-refunded-before-account','refund')",
    );
    const refundUser = '33333333-3333-4333-8333-333333333333';
    await db.query(
      "insert into auth.users(id,email,email_confirmed_at) values($1,'refund@example.com',now())",
      [refundUser],
    );
    assert.equal(
      (await db.query("select claim_gumroad_pending_course_purchases('refund@example.com') as n")).rows[0].n,
      0,
    );
    assert.equal(
      Boolean((await db.query("select revoked_at from gumroad_pending_course_purchases where sale_id='sale-refunded-before-account'")).rows[0].revoked_at),
      true,
    );

    await addSale('sale-existing-account', 'existing@example.com');
    const existingUser = '44444444-4444-4444-8444-444444444444';
    await db.query(
      "insert into auth.users(id,email,email_confirmed_at) values($1,'existing@example.com',now())",
      [existingUser],
    );
    await fulfill('sale-existing-account', 'existing@example.com');
    assert.equal(
      (await db.query("select active from course_enrollments where user_id=$1", [existingUser])).rows[0].active,
      true,
    );

    // A dispute Ping revokes a claimed order and its enrollment.
    await addSale('sale-existing-account', 'existing@example.com', 'dispute');
    await db.query(
      "select process_gumroad_revocation_ping('sale-existing-account','dispute')",
    );
    assert.equal(
      (await db.query('select status from course_orders where provider_payment_id=$1', ['sale-existing-account'])).rows[0].status,
      'refunded',
    );
    assert.equal(
      (await db.query('select active from course_enrollments where user_id=$1', [existingUser])).rows[0].active,
      false,
    );

    await assert.rejects(() => fulfill('sale-existing-account', 'existing@example.com'));
    console.log('PASS: verified sale queued before account creation, idempotent claim, direct fulfillment, and refunds before/after signup.');
  } finally {
    await db.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
