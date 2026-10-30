import { currentAccount } from "../../../../lib/account/server";
import { accountJson } from "../../../../lib/account/http";
export async function GET(request: Request) {
  const { client, user } = await currentAccount();
  if (!client || !user) return accountJson({ error: "signin" }, 401);
  const q = new URL(request.url).searchParams,
    after = q.get("after");
  if (after && !/^[0-9a-f-]{36}$/i.test(after))
    return accountJson({ error: "invalid" }, 400);
  const { data, error } = await client.rpc("owner_course_students", {
    p_search: (q.get("search") || "").slice(0, 254),
    p_after: after,
  });
  return error
    ? accountJson(
        { error: error.code === "42501" ? "forbidden" : "setup" },
        error.code === "42501" ? 403 : 503,
      )
    : accountJson({
        items: (data || []).slice(0, 50),
        more: (data || []).length > 50,
      });
}
