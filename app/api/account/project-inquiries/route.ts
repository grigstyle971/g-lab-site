import { currentAccount } from "../../../../lib/account/server";
import { accountJson, sameOrigin } from "../../../../lib/account/http";

export async function GET() {
  const { client, user } = await currentAccount();
  if (!client || !user) return accountJson({ error: "signin" }, 401);
  const { data, error } = await client.rpc("owner_project_inquiries");
  return error
    ? accountJson({ error: error.code === "42501" ? "forbidden" : "setup" }, error.code === "42501" ? 403 : 503)
    : accountJson({ items: data });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return accountJson({ error: "origin" }, 403);
  const { client, user } = await currentAccount();
  if (!client || !user) return accountJson({ error: "signin" }, 401);
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return accountJson({ error: "invalid" }, 400);
    body = parsed as Record<string, unknown>;
  } catch {
    return accountJson({ error: "invalid" }, 400);
  }
  if (typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id) || !["new", "replied", "closed"].includes(String(body.status)))
    return accountJson({ error: "invalid" }, 400);
  const { error } = await client.rpc("owner_update_project_inquiry", { p_id: body.id, p_status: body.status });
  return error
    ? accountJson({ error: error.code === "42501" ? "forbidden" : "setup" }, error.code === "42501" ? 403 : 503)
    : accountJson({ ok: true });
}
