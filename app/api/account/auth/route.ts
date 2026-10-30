import { adminClient, authRequestClient } from "../../../../lib/account/server";
import {
  enforceAuthRateLimit,
  trustedClientIp,
} from "../../../../lib/account/auth-rate-limit";
import {
  appOrigin,
  PASSWORD_RECOVERY_LOCALE_COOKIE,
  safeNext,
} from "../../../../lib/account/config";
import { accountJson, sameOrigin } from "../../../../lib/account/http";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return accountJson({ error: "origin" }, 403);
  let body;
  try {
    body = await request.json();
  } catch {
    return accountJson({ error: "invalid" }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    return accountJson({ error: "invalid" }, 400);
  const locale = body.locale === "ru" ? "ru" : "en";
  const next = safeNext(body.next, locale);
  const action = body.action;
  if (![
    "signin",
    "signup",
    "request-code",
    "resend-code",
    "verify-code",
    "reset",
    "verify-reset-code",
    "password",
    "signout",
  ].includes(action))
    return accountJson({ error: "invalid" }, 400);
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (
    !["password", "signout"].includes(action) &&
    (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
  )
    return accountJson({ error: "email" }, 400);
  if (
    !["reset", "resend-code", "signout"].includes(action) &&
    (password.length > 128 || password.length < (action === "signin" ? 1 : 10))
  )
    return accountJson({ error: "password" }, 400);
  if (["signup", "request-code"].includes(action) && body.termsAccepted !== true)
    return accountJson({ error: "terms" }, 400);
  const visitorIp = trustedClientIp(request);
  if (!visitorIp) return accountJson({ error: "unavailable" }, 503);
  const rateLimit = await enforceAuthRateLimit(visitorIp, action, email);
  if (!rateLimit.available) return accountJson({ error: "unavailable" }, 503);
  if (!rateLimit.allowed)
    return accountJson(
      { error: "rate-limit" },
      429,
      { "Retry-After": String(rateLimit.retryAfterSeconds) },
    );
  const client = await authRequestClient(visitorIp);
  if (!client) return accountJson({ error: "unavailable" }, 503);
  if (action === "signout") {
    const { error } = await client.auth.signOut();
    return accountJson(
      error ? { error: "retry" } : { ok: true },
      error ? 503 : 200,
    );
  }
  let privileged: ReturnType<typeof adminClient> | null = null;
  if (["signup", "request-code", "resend-code", "verify-code"].includes(action)) {
    try {
      privileged = adminClient();
      const { data, error } = await privileged.rpc(
        "course_account_signup_allowed",
        { p_buyer_email: email },
      );
      if (error) return accountJson({ error: "unavailable" }, 503);
      if (data !== true) return accountJson({ error: "purchase-required" }, 403);
    } catch {
      return accountJson({ error: "unavailable" }, 503);
    }
  }
  if (action === "signin") {
    const { error } = await client.auth.signInWithPassword({ email, password });
    return accountJson(
      error ? { error: "credentials" } : { ok: true, next },
      error ? 400 : 200,
    );
  }
  if (["signup", "request-code", "resend-code"].includes(action)) {
    if (action !== "resend-code") {
      try {
        const { error: createError } = await privileged!.auth.admin.createUser({
          email,
          email_confirm: false,
          user_metadata: {
            terms_accepted_at: new Date().toISOString(),
            terms_version: "2026-09-24",
          },
        });
        // A retry for an address that already started verification is safe:
        // continue to send an OTP, but never let OTP implicitly create users.
        if (
          createError &&
          !["email_exists", "user_already_exists"].includes(createError.code || "")
        ) {
          return accountJson({ error: "code-request" }, 400);
        }
      } catch {
        return accountJson({ error: "unavailable" }, 503);
      }
    }
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) return accountJson({ error: "code-request" }, 400);
    return accountJson({ ok: true, message: "code-sent" });
  }
  if (action === "verify-code") {
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!/^\d{6,10}$/.test(token)) return accountJson({ error: "code" }, 400);

    // If a previous verification succeeded but password update failed, the
    // confirmed session lets the buyer retry password setup without reusing OTP.
    const current = await client.auth.getUser();
    let user =
      !current.error && current.data.user?.email?.toLowerCase() === email
        ? current.data.user
        : null;
    if (!user) {
      const { data, error } = await client.auth.verifyOtp({
        email,
        token,
        type: "email",
      });
      if (error || !data.user) return accountJson({ error: "code" }, 400);
      user = data.user;
    }

    if (!user.email_confirmed_at)
      return accountJson({ error: "code" }, 400);
    const { error: passwordError } = await client.auth.updateUser({ password });
    if (passwordError) return accountJson({ error: "password-update" }, 400);

    let purchaseClaimed = false;
    let manualAccessClaimed = false;
    if (process.env.SUPABASE_SECRET_KEY && user.email) {
      try {
        const { data, error } = await adminClient().rpc(
          "claim_gumroad_pending_course_purchases",
          { p_buyer_email: user.email },
        );
        purchaseClaimed = !error && Number(data) > 0;
        const manual = await adminClient().rpc(
          "claim_course_manual_access_invite",
          { p_buyer_email: user.email },
        );
        manualAccessClaimed = !manual.error && manual.data === true;
      } catch {
        // Authentication is already complete; the dashboard can retry the
        // purchase claim after Gumroad's webhook or manual grant has arrived.
      }
    }
    return accountJson({ ok: true, next, purchaseClaimed, manualAccessClaimed });
  }
  if (action === "reset") {
    // Use the numeric recovery token from Supabase's Reset Password template.
    // Recovery links are single-use and mail security scanners can consume them
    // before the customer opens the message. A code is entered on this site and
    // does not depend on the Supabase Site URL or a callback cookie. Keep a
    // production callback as a fallback for projects still using link templates.
    const resetCallback = new URL("/auth/callback", appOrigin());
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: resetCallback.toString(),
    });
    // Avoid revealing whether this address has an account.
    const response = accountJson(
      error ? { error: "retry" } : { ok: true, message: "reset-code-sent" },
      error ? 503 : 200,
    );
    if (!error) {
      const secure = resetCallback.protocol === "https:" ? "; Secure" : "";
      response.headers.append(
        "Set-Cookie",
        `${PASSWORD_RECOVERY_LOCALE_COOKIE}=${locale}; Path=/; Max-Age=900; HttpOnly; SameSite=Lax${secure}`,
      );
    }
    return response;
  }
  if (action === "verify-reset-code") {
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!/^\d{6,10}$/.test(token)) return accountJson({ error: "code" }, 400);
    // Recovery OTPs are single-use. If Supabase accepted the code but the
    // password update failed, let the same signed-in user retry the update
    // without asking them to consume the code a second time.
    const current = await client.auth.getUser();
    const alreadyVerifiedForEmail =
      !current.error && current.data.user?.email?.toLowerCase() === email;
    if (!alreadyVerifiedForEmail) {
      const { error: verifyError } = await client.auth.verifyOtp({
        email,
        token,
        type: "recovery",
      });
      if (verifyError) return accountJson({ error: "code" }, 400);
    }
    const { error: passwordError } = await client.auth.updateUser({ password });
    if (passwordError) return accountJson({ error: "password-update" }, 400);
    return accountJson({
      ok: true,
      next: safeNext(body.next, locale),
    });
  }
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user) return accountJson({ error: "expired" }, 401);
  const { error } = await client.auth.updateUser({ password });
  return accountJson(
    error
      ? { error: "retry" }
      : { ok: true, next: locale === "ru" ? "/ru/account" : "/account" },
    error ? 400 : 200,
  );
}
