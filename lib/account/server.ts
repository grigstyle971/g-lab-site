import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { authConfigured, COURSE_ID, supabaseUrl, supabasePublishableKey } from "./config";
export async function accountClient() {
  if (!authConfigured()) return null;
  const jar = await cookies();
  return createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (values) => {
          try {
            values.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Proxy persists refresh cookies for server components. */
          }
        },
      },
    },
  );
}
export async function authRequestClient(forwardedIp: string) {
  if (!authConfigured()) return null;
  const key = process.env.SUPABASE_SECRET_KEY;
  // Supabase only trusts Sb-Forwarded-For when the request uses a new secret
  // API key. Keep the fallback for local/legacy deployments; the app limiter
  // still uses the trusted Vercel IP in either case.
  const canForwardIp = Boolean(key?.startsWith("sb_secret_"));
  const jar = await cookies();
  return createServerClient(
    supabaseUrl,
    canForwardIp ? key! : supabasePublishableKey,
    {
      global: canForwardIp
        ? { headers: { "sb-forwarded-for": forwardedIp } }
        : undefined,
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (values) => {
          try {
            values.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Proxy persists refresh cookies for server components. */
          }
        },
      },
    },
  );
}
export function adminClient() {
  if (!supabaseUrl || !process.env.SUPABASE_SECRET_KEY)
    throw new Error("Account database is not configured");
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export async function currentAccount() {
  const client = await accountClient();
  if (!client) return { client: null, user: null };
  const { data, error } = await client.auth.getUser();
  return { client, user: error ? null : data.user };
}
export async function hasCourseAccess() {
  const { client, user } = await currentAccount();
  if (!user || !client) return false;
  const { data, error } = await client
    .from("course_enrollments")
    .select("course_id")
    .eq("user_id", user.id)
    .eq("course_id", COURSE_ID)
    .eq("active", true)
    .maybeSingle();
  return !error && Boolean(data);
}
