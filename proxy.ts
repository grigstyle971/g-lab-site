import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authConfigured, supabaseUrl, supabasePublishableKey } from "./lib/account/config";
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!authConfigured()) return response;
  const client = createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) => {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  await client.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: [
    "/account/:path*",
    "/ru/account/:path*",
    "/login",
    "/ru/login",
    "/learn/:path*",
    "/ru/learn/:path*",
    "/course-checkout",
    "/ru/course-checkout",
    "/api/account/:path*",
    "/api/checkout/:path*",
  ],
};
