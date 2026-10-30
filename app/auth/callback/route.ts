import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { accountClient } from "../../../lib/account/server";
import {
  appOrigin,
  PASSWORD_RECOVERY_LOCALE_COOKIE,
  safeNext,
} from "../../../lib/account/config";
export async function GET(request: Request) {
  const url = new URL(request.url),
    client = await accountClient();
  const rawNext = url.searchParams.get("next");
  const cookieJar = await cookies();
  const recoveryLocale = cookieJar.get(PASSWORD_RECOVERY_LOCALE_COOKIE)?.value;
  const locale = rawNext?.startsWith("/ru/") || recoveryLocale === "ru" ? "ru" : "en";
  const passwordPath =
    locale === "ru" ? "/ru/account/password" : "/account/password";
  const next = rawNext === passwordPath
    ? passwordPath
    : rawNext
      ? safeNext(rawNext, locale)
      : recoveryLocale === "ru" || recoveryLocale === "en"
        ? passwordPath
        : safeNext(rawNext, locale);
  const code = url.searchParams.get("code");
  if (client && code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return redirectAndClearRecoveryCookie(next);
  }
  return redirectAndClearRecoveryCookie(
    `${locale === "ru" ? "/ru" : ""}/login?error=expired`,
  );
}

function redirectAndClearRecoveryCookie(path: string) {
  const response = NextResponse.redirect(new URL(path, appOrigin()), {
    headers: { "Cache-Control": "private, no-store" },
  });
  response.cookies.set(PASSWORD_RECOVERY_LOCALE_COOKIE, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(appOrigin()).protocol === "https:",
  });
  return response;
}
