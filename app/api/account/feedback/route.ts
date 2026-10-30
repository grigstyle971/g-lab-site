import { currentAccount } from "../../../../lib/account/server";
import { accountJson, sameOrigin } from "../../../../lib/account/http";
import { lessons } from "../../../../lib/course";
export async function GET(request: Request) {
  const { client, user } = await currentAccount();
  if (!client || !user) return accountJson({ error: "signin" }, 401);
  const { data, error } = await client.rpc("owner_course_feedback", {
    p_resolved: new URL(request.url).searchParams.get("resolved") === "true",
  });
  return error
    ? accountJson(
        { error: error.code === "42501" ? "forbidden" : "setup" },
        error.code === "42501" ? 403 : 503,
      )
    : accountJson({ items: data });
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return accountJson({ error: "forbidden" }, 403);
  const { client, user } = await currentAccount();
  if (!client || !user) return accountJson({ error: "signin" }, 401);
  let b;
  try {
    b = await request.json();
  } catch {
    return accountJson({ error: "invalid" }, 400);
  }
  if (!b || typeof b !== "object")
    return accountJson({ error: "invalid" }, 400);
  if (b.action === "resolve") {
    if (
      typeof b.id !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(b.id) ||
      typeof b.resolved !== "boolean"
    )
      return accountJson({ error: "invalid" }, 400);
    const { error } = await client.rpc("owner_resolve_feedback", {
      p_id: b.id,
      p_resolved: b.resolved,
    });
    return error
      ? accountJson({ error: "forbidden" }, 403)
      : accountJson({ ok: true });
  }
  if (
    !lessons.some((l) => l.slug === b.slug) ||
    typeof b.step !== "string" ||
    !b.step.trim() ||
    b.step.length > 120 ||
    typeof b.message !== "string" ||
    b.message.trim().length < 5 ||
    b.message.length > 2000
  )
    return accountJson({ error: "invalid" }, 400);
  const { error } = await client.rpc("send_course_feedback", {
    p_slug: b.slug,
    p_step: b.step,
    p_message: b.message,
  });
  return error
    ? accountJson(
        {
          error:
            error.code === "P0001"
              ? "limit"
              : error.code === "42501"
                ? "access"
                : "setup",
        },
        error.code === "P0001" ? 429 : 503,
      )
    : accountJson({ ok: true });
}
