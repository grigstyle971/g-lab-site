import { currentAccount } from "../../../../lib/account/server";
import { accountJson, sameOrigin } from "../../../../lib/account/http";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return accountJson({ error: "forbidden" }, 403);
  const { client, user } = await currentAccount();
  if (!client || !user) return accountJson({ error: "signin" }, 401);
  if (user.email?.toLowerCase() !== "grigstyle971@gmail.com" || !user.email_confirmed_at)
    return accountJson({ error: "forbidden" }, 403);
  let body;
  try { body = await request.json(); } catch { return accountJson({ error: "invalid" }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return accountJson({ error: "invalid" }, 400);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !reason || reason.length > 500 || typeof body.active !== "boolean")
    return accountJson({ error: "invalid" }, 400);
  const { data, error } = await client.rpc("owner_set_course_access", { p_email: email, p_active: body.active, p_reason: reason });
  if (error) {
    const code = error.code === "42501" ? "forbidden" : error.code === "P0001" ? "student" : "setup";
    return accountJson({ error: code }, code === "forbidden" ? 403 : code === "student" ? 400 : 503);
  }
  if (!data?.[0]) return accountJson({ error: "setup" }, 503);
  return accountJson({
    ok: true,
    active: data[0].access_active,
    registrationPending: data[0].registration_pending === true,
  });
}
