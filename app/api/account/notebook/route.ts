import { currentAccount } from "../../../../lib/account/server";
import { accountJson, sameOrigin } from "../../../../lib/account/http";
import { lessons } from "../../../../lib/course";
import { validNotebook } from "../../../../lib/account/notebook";
export async function GET(request: Request) {
  const { client, user } = await currentAccount();
  if (!client || !user) return accountJson({ error: "signin" }, 401);
  const slug = new URL(request.url).searchParams.get("slug");
  if (!lessons.some((l) => l.slug === slug))
    return accountJson({ error: "invalid" }, 400);
  const { data, error } = await client
    .from("course_notebooks")
    .select("content,revision,updated_at")
    .eq("user_id", user.id)
    .eq("lesson_slug", slug)
    .maybeSingle();
  return error
    ? accountJson({ error: "setup" }, 503)
    : accountJson({ notebook: data, userId: user.id });
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return accountJson({ error: "forbidden" }, 403);
  const { client, user } = await currentAccount();
  if (!client || !user) return accountJson({ error: "signin" }, 401);
  let b;
  try {
    const raw = await request.text();
    if (raw.length > 25000) return accountJson({ error: "invalid" }, 400);
    b = JSON.parse(raw);
  } catch {
    return accountJson({ error: "invalid" }, 400);
  }
  if (
    !b ||
    !lessons.some((l) => l.slug === b.slug) ||
    !validNotebook(b.content) ||
    !Number.isInteger(b.revision) ||
    b.revision < 0
  )
    return accountJson({ error: "invalid" }, 400);
  if (b.userId !== user.id) return accountJson({ error: "account" }, 409);
  const { data, error } = await client.rpc("save_course_notebook", {
    p_slug: b.slug,
    p_content: b.content,
    p_revision: b.revision,
  });
  return error
    ? accountJson(
        {
          error:
            error.code === "40001"
              ? "conflict"
              : error.code === "42501"
                ? "access"
                : "setup",
        },
        error.code === "40001" ? 409 : 503,
      )
    : accountJson({ revision: data });
}
