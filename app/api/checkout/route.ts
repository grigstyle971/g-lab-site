import { currentAccount, hasCourseAccess } from "../../../lib/account/server";
import { accountJson, sameOrigin } from "../../../lib/account/http";
import {
  gumroadProductUrl,
  paymentConfigured,
} from "../../../lib/account/config";
export const runtime = "nodejs";
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
  if (body.provider !== "gumroad")
    return accountJson({ error: "unavailable" }, 503);
  if (!paymentConfigured("gumroad"))
    return accountJson({ error: "unavailable" }, 503);
  const prefix = body.locale === "ru" ? "/ru" : "";
  const { user } = await currentAccount();
  if (user && await hasCourseAccess())
    return accountJson({ url: `${prefix}/account` });
  try {
    const url = gumroadProductUrl();
    url.searchParams.set("wanted", "true");
    if (user?.email && user.email_confirmed_at)
      url.searchParams.set("email", user.email);
    return accountJson({ url: url.toString() });
  } catch {
    return accountJson({ error: "unavailable" }, 503);
  }
}
