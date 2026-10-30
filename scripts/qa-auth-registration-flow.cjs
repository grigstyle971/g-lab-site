const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const ts = require("typescript");
const originalLoad = Module._load;
let purchaseAllowed = false;
let createUserError = null;
const calls = { createUser: [], otp: [], verify: [], password: [], reset: [], resetOptions: [], claims: [] };

const admin = {
  auth: {
    admin: {
      createUser: async (attributes) => {
        calls.createUser.push(attributes);
        return { data: { user: { email: attributes.email } }, error: createUserError };
      },
    },
  },
  rpc: async (name, args) => {
    if (name === "course_account_signup_allowed")
      return { data: purchaseAllowed, error: null };
    calls.claims.push([name, args]);
    return { data: name.includes("gumroad") ? 0 : false, error: null };
  },
};
const client = {
  auth: {
    signInWithOtp: async (args) => {
      calls.otp.push(args);
      return { error: null };
    },
    getUser: async () => ({ data: { user: null }, error: new Error("none") }),
    verifyOtp: async (args) => {
      calls.verify.push(args);
      return {
        data: { user: { email: args.email, email_confirmed_at: new Date().toISOString() } },
        error: null,
      };
    },
    updateUser: async (args) => {
      calls.password.push(args);
      return { error: null };
    },
    resetPasswordForEmail: async (email, options) => {
      calls.reset.push(email);
      calls.resetOptions.push(options);
      return { error: null };
    },
    signInWithPassword: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
  },
};

Module._load = function (name, parent) {
  if (parent?.filename?.endsWith("app\\api\\account\\auth\\route.ts")) {
    if (name === "../../../../lib/account/server")
      return { accountClient: async () => client, adminClient: () => admin };
    if (name === "../../../../lib/account/config")
      return {
        appOrigin: () => "https://g-lab.agency",
        PASSWORD_RECOVERY_LOCALE_COOKIE: "g-lab-password-recovery-locale",
        safeNext: (value) => value || "/account",
      };
    if (name === "../../../../lib/account/http")
      return {
        accountJson: (body, status = 200) => Response.json(body, { status }),
        sameOrigin: (request) =>
          request.headers.get("origin") === "https://g-lab.agency",
      };
  }
  return originalLoad.apply(this, arguments);
};
require.extensions[".ts"] = (module, file) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }).outputText,
    file,
  );

function request(body) {
  return new Request("https://g-lab.agency/api/account/auth", {
    method: "POST",
    headers: {
      Origin: "https://g-lab.agency",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

(async () => {
  const priorSecret = process.env.SUPABASE_SECRET_KEY;
  process.env.SUPABASE_SECRET_KEY = "local-test-only";
  const { POST } = require("../app/api/account/auth/route.ts");
  try {
    const signup = {
      action: "signup",
      email: "buyer@example.com",
      password: "a-long-test-password",
      termsAccepted: true,
    };

    const blocked = await POST(request(signup));
    assert.equal(blocked.status, 403);
    assert.equal((await blocked.json()).error, "purchase-required");
    assert.equal(calls.createUser.length, 0);
    assert.equal(calls.otp.length, 0);

    purchaseAllowed = true;
    const started = await POST(request(signup));
    assert.equal(started.status, 200);
    assert.equal(calls.createUser.length, 1);
    assert.equal(calls.createUser[0].email_confirm, false);
    assert.equal(calls.createUser[0].email, "buyer@example.com");
    assert.equal(calls.otp[0].email, "buyer@example.com");
    assert.equal(calls.otp[0].options.shouldCreateUser, false);

    createUserError = { code: "email_exists" };
    const retried = await POST(request(signup));
    assert.equal(retried.status, 200);
    assert.equal(calls.otp.length, 2);
    assert.equal(calls.otp[1].options.shouldCreateUser, false);

    const verified = await POST(
      request({
        ...signup,
        action: "verify-code",
        token: "12345678",
      }),
    );
    assert.equal(verified.status, 200);
    assert.equal(calls.verify[0].token, "12345678");
    assert.equal(calls.password[0].password, signup.password);

    const recoveryRequested = await POST(
      request({ action: "reset", email: "buyer@example.com" }),
    );
    assert.equal(recoveryRequested.status, 200);
    assert.equal((await recoveryRequested.json()).message, "reset-code-sent");
    assert.deepEqual(calls.reset, ["buyer@example.com"]);
    assert.equal(
      calls.resetOptions[0].redirectTo,
      "https://g-lab.agency/auth/callback",
    );
    assert.match(recoveryRequested.headers.get("set-cookie"), /g-lab-password-recovery-locale=en/);

    const russianRecovery = await POST(
      request({ action: "reset", email: "buyer@example.com", locale: "ru" }),
    );
    assert.equal(russianRecovery.status, 200);
    assert.equal(calls.resetOptions[1].redirectTo, "https://g-lab.agency/auth/callback");
    assert.match(russianRecovery.headers.get("set-cookie"), /g-lab-password-recovery-locale=ru/);

    const shortRecoveryCode = await POST(
      request({
        action: "verify-reset-code",
        email: "buyer@example.com",
        password: "a-new-long-password",
        token: "12345",
      }),
    );
    assert.equal(shortRecoveryCode.status, 400);
    assert.equal(calls.verify.length, 1, "invalid recovery codes must not be sent to Supabase");

    const recovered = await POST(
      request({
        action: "verify-reset-code",
        email: "buyer@example.com",
        password: "a-new-long-password",
        token: "87654321",
      }),
    );
    assert.equal(recovered.status, 200);
    assert.equal(calls.verify[1].type, "recovery");
    assert.equal(calls.verify[1].token, "87654321");
    assert.equal(calls.password[1].password, "a-new-long-password");

    purchaseAllowed = false;
    const stranger = await POST(request({ ...signup, email: "stranger@example.com" }));
    assert.equal(stranger.status, 403);
    assert.equal(calls.otp.length, 2);
    console.log(
      "PASS: paid/manual access gates signup; 8-digit OTP recovery verifies in RU/EN, uses the production callback rather than localhost, and updates the password.",
    );
  } finally {
    if (priorSecret === undefined) delete process.env.SUPABASE_SECRET_KEY;
    else process.env.SUPABASE_SECRET_KEY = priorSecret;
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
