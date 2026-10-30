import {
  currentAccount,
  hasCourseAccess,
} from "../../../../lib/account/server";
import { accountJson, sameOrigin } from "../../../../lib/account/http";
import { lessons } from "../../../../lib/course";
export async function GET() {
  const { client, user } = await currentAccount();
  if (!client || !user) return accountJson({ error: "signin" }, 401);
  const { data, error } = await client
    .from("course_progress")
    .select("lesson_slug")
    .eq("user_id", user.id);
  return error
    ? accountJson({ error: "unavailable" }, 503)
    : accountJson({
        userId: user.id,
        completed: data.map((r) => r.lesson_slug),
      });
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return accountJson({ error: "origin" }, 403);
  const { client, user } = await currentAccount();
  if (!client || !user) return accountJson({ error: "signin" }, 401);
  let body;
  try {
    body = await request.json();
  } catch {
    return accountJson({ error: "invalid" }, 400);
  }
  if (!body || typeof body !== "object")
    return accountJson({ error: "invalid" }, 400);
  if (!lessons.some((l) => l.slug === body.slug))
    return accountJson({ error: "invalid" }, 400);
  if (!(await hasCourseAccess()))
    return accountJson({ error: "access" }, 403);
  const { error } = await client
    .from("course_progress")
    .insert({ user_id: user.id, lesson_slug: body.slug });
  return error && error.code !== "23505"
    ? accountJson({ error: "retry" }, 503)
    : accountJson({ ok: true });
}
