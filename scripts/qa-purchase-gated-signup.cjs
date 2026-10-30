const assert = require("node:assert/strict");
const fs = require("node:fs");
const { PGlite } = require("@electric-sql/pglite");

const migrations = [
  "202609050001_course_accounts.sql",
  "202609060001_manual_course_access.sql",
  "202609060002_owner_access_panel.sql",
  "202609060003_learning_workspace.sql",
  "202609240001_gumroad_course_payments.sql",
  "202609240002_gumroad_pay_after_signup.sql",
  "202609250001_purchase_gated_signup_and_manual_invites.sql",
];

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
        email text unique,
        email_confirmed_at timestamptz,
        created_at timestamptz not null default now()
      );
      create function auth.uid() returns uuid language sql stable as
        'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
      grant usage on schema auth, public to anon, authenticated, service_role;
      grant all on auth.users to service_role;
    `);
    const owner = "99999999-9999-4999-8999-999999999999";
    await db.query(
      "insert into auth.users(id,email,email_confirmed_at) values($1,'grigstyle971@gmail.com',now())",
      [owner],
    );
    for (const file of migrations) {
      await db.exec(
        fs.readFileSync(`supabase/migrations/${file}`, "utf8"),
      );
    }

    const allowed = async (email) =>
      (await db.query("select course_account_signup_allowed($1) as allowed", [email]))
        .rows[0].allowed;
    assert.equal(
      await db.query(
        "select has_function_privilege('anon','public.course_account_signup_allowed(text)','EXECUTE') as can_call",
      ).then((r) => r.rows[0].can_call),
      false,
      "public clients must not query the purchase gate",
    );
    await db.exec("set role service_role");
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner]);
    assert.equal(
      (await db.query("select course_can_study('welcome') as allowed")).rows[0].allowed,
      false,
      "The signup migration must preserve the paid-only lesson gate",
    );
    await db.exec("reset role; set role service_role");
    assert.equal(await allowed("stranger@example.com"), false);

    await db.query(
      "insert into gumroad_ping_queue(sale_id,resource_name) values('paid-course','sale')",
    );
    await db.query(
      "insert into gumroad_pending_course_purchases(sale_id,buyer_email,amount,currency) values('paid-course','buyer@example.com',4900,'usd')",
    );
    assert.equal(await allowed(" BUYER@example.com "), true);
    await db.query(
      "insert into gumroad_ping_queue(sale_id,resource_name) values('paid-course','refund')",
    );
    assert.equal(await allowed("buyer@example.com"), false);
    await db.query(
      "delete from gumroad_ping_queue where sale_id='paid-course' and resource_name='refund'",
    );

    await db.exec("reset role; set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner]);
    const reserved = await db.query(
      "select * from owner_set_course_access('gift@example.com',true,'Student gift')",
    );
    assert.equal(reserved.rows[0].registration_pending, true);
    assert.equal(reserved.rows[0].access_active, true);
    await db.exec("reset role; set role service_role");
    assert.equal(await allowed("gift@example.com"), true);
    await db.exec("reset role; set role authenticated");
    const ownerList = await db.query(
      "select owner_course_students('gift@example.com',null) as students",
    );
    assert.equal(ownerList.rows[0].students[0].pending_registration, true);
    await db.query(
      "select owner_set_course_access('gift@example.com',false,'Invite cancelled')",
    );
    await db.exec("reset role; set role service_role");
    assert.equal(await allowed("gift@example.com"), false);

    await db.exec("reset role; set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner]);
    await db.query(
      "select owner_set_course_access('gift@example.com',true,'Student gift')",
    );
    await db.exec("reset role; set role service_role");
    const student = "11111111-1111-4111-8111-111111111111";
    await db.query(
      "insert into auth.users(id,email,email_confirmed_at) values($1,'gift@example.com',now())",
      [student],
    );
    assert.equal(
      (await db.query(
        "select claim_course_manual_access_invite('gift@example.com') as claimed",
      )).rows[0].claimed,
      true,
    );
    assert.equal(await allowed("gift@example.com"), true);
    assert.equal(
      (await db.query(
        "select active from course_enrollments where user_id=$1",
        [student],
      )).rows[0].active,
      true,
    );
    assert.equal(
      (await db.query(
        "select claimed_at is not null as claimed from course_manual_access_invites where email='gift@example.com'",
      )).rows[0].claimed,
      true,
    );

    await db.exec("reset role; set role service_role");
    const paidStudent = "22222222-2222-4222-8222-222222222222";
    await db.query(
      "insert into auth.users(id,email,email_confirmed_at) values($1,'buyer@example.com',now())",
      [paidStudent],
    );
    assert.equal(
      (await db.query(
        "select claim_gumroad_pending_course_purchases('buyer@example.com') as count",
      )).rows[0].count,
      1,
    );
    assert.equal(await allowed("buyer@example.com"), true);
    assert.equal(
      (await db.query(
        "select active from course_enrollments where user_id=$1",
        [paidStudent],
      )).rows[0].active,
      true,
    );

    await db.close();
    console.log(
      "PASS: migration chain; closed public gate; verified Gumroad sale and manual invite enable only the matching email; revoked invites close the gate; verified manual invites and Gumroad purchases activate enrollment.",
    );
  } catch (error) {
    await db.close();
    throw error;
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
