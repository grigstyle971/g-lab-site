import { currentAccount } from "../../../../lib/account/server";
import { accountJson, privateHeaders } from "../../../../lib/account/http";
import { workspaceSetupSql } from "../../../../lib/account/workspace-setup";
export async function GET() {
  const { user } = await currentAccount();
  if (
    !user ||
    user.email?.toLowerCase() !== "grigstyle971@gmail.com" ||
    !user.email_confirmed_at
  )
    return accountJson({ error: "forbidden" }, 403);
  return new Response(workspaceSetupSql, {
    headers: { ...privateHeaders, "Content-Type": "text/plain; charset=utf-8" },
  });
}
