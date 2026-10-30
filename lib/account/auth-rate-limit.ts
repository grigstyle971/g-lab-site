import "server-only";
import { createHash, createHmac } from "node:crypto";
import { isIP } from "node:net";
import { adminClient } from "./server";

type AuthAction =
  | "signin"
  | "signup"
  | "request-code"
  | "resend-code"
  | "verify-code"
  | "reset"
  | "verify-reset-code"
  | "password"
  | "signout";

type LimitScope =
  | "auth-api-ip"
  | "signin-ip"
  | "signin-email"
  | "verify-ip"
  | "verify-email"
  | "send-ip"
  | "send-email"
  | "password-ip";

type LimitResult = {
  allowed: boolean;
  retry_after_seconds: number;
};

const fallbackRules: Record<
  LimitScope,
  [limit: number, windowSeconds: number]
> = {
  "auth-api-ip": [60, 600],
  "signin-ip": [12, 900],
  "signin-email": [8, 900],
  "verify-ip": [20, 900],
  "verify-email": [8, 900],
  "send-ip": [12, 3600],
  "send-email": [3, 3600],
  "password-ip": [20, 900],
};

type FallbackBucket = { windowStartedAt: number; attemptCount: number };
const fallbackBuckets = new Map<string, FallbackBucket>();
let fallbackRequests = 0;
let fallbackWarningSent = false;

export function trustedClientIp(request: Request): string | null {
  if (process.env.NODE_ENV === "development" && !process.env.VERCEL)
    return "127.0.0.1";

  // Vercel overwrites these headers at its edge. The standard header may be a
  // comma-separated proxy chain, whose first address is the original visitor.
  for (const raw of [
    request.headers.get("x-vercel-forwarded-for"),
    request.headers.get("x-forwarded-for"),
  ]) {
    const ip = raw?.split(",", 1)[0]?.trim();
    if (ip && isIP(ip)) return ip;
  }
  return null;
}

function scopesFor(action: AuthAction): Array<[LimitScope, string]> {
  if (action === "signin") return [["signin-ip", "ip"], ["signin-email", "email"]];
  if (action === "verify-code" || action === "verify-reset-code")
    return [["verify-ip", "ip"], ["verify-email", "email"]];
  if (
    action === "signup" ||
    action === "request-code" ||
    action === "resend-code" ||
    action === "reset"
  )
    return [["send-ip", "ip"], ["send-email", "email"]];
  if (action === "password") return [["password-ip", "ip"]];
  return [];
}

export async function enforceAuthRateLimit(
  ip: string,
  action: AuthAction,
  email: string,
) {
  if (process.env.NODE_ENV === "development" && !process.env.VERCEL)
    return { available: true, allowed: true, retryAfterSeconds: 0 };

  const secret = process.env.SUPABASE_SECRET_KEY;

  const keys: Array<[LimitScope, string]> = [["auth-api-ip", ip]];
  keys.push(...scopesFor(action).map(([scope, identity]) => [
    scope,
    identity === "ip" ? ip : email,
  ] as [LimitScope, string]));

  const useLocalFallback = () => {
    if (!fallbackWarningSent) {
      fallbackWarningSent = true;
      console.error(
        "[account-auth] Supabase rate-limit RPC unavailable; using per-instance fallback limits",
      );
    }

    const now = Date.now();
    let retryAfterSeconds = 0;
    for (const [scope, value] of keys) {
      const [limit, windowSeconds] = fallbackRules[scope];
      const windowStartedAt =
        Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000;
      const identity = createHash("sha256")
        .update(`${scope}\0${value}`)
        .digest("hex");
      const bucketKey = `${scope}:${identity}`;
      const current = fallbackBuckets.get(bucketKey);
      const attemptCount =
        current?.windowStartedAt === windowStartedAt
          ? current.attemptCount + 1
          : 1;
      fallbackBuckets.set(bucketKey, { windowStartedAt, attemptCount });
      if (attemptCount > limit) {
        retryAfterSeconds = Math.max(
          retryAfterSeconds,
          Math.max(
            1,
            Math.ceil((windowStartedAt + windowSeconds * 1000 - now) / 1000),
          ),
        );
      }
    }

    fallbackRequests += 1;
    if (fallbackRequests % 128 === 0) {
      for (const [key, bucket] of fallbackBuckets) {
        const scope = key.slice(0, key.indexOf(":")) as LimitScope;
        if (bucket.windowStartedAt + fallbackRules[scope][1] * 1000 < now)
          fallbackBuckets.delete(key);
      }
      if (fallbackBuckets.size > 20_000) {
        const excess = fallbackBuckets.size - 20_000;
        let removed = 0;
        for (const key of fallbackBuckets.keys()) {
          fallbackBuckets.delete(key);
          removed += 1;
          if (removed >= excess) break;
        }
      }
    }

    return {
      available: true,
      allowed: retryAfterSeconds === 0,
      retryAfterSeconds,
    };
  };

  // Keep sign-in and recovery available during a database migration or RPC
  // outage. Each warm function instance still enforces the same limits, while
  // Supabase Auth applies its own provider-side limits to the forwarded IP.
  if (!secret) return useLocalFallback();

  let retryAfterSeconds = 0;
  try {
    const db = adminClient();
    for (const [scope, value] of keys) {
      const subjectHash = createHmac("sha256", secret)
        .update(`${scope}\0${value}`)
        .digest("hex");
      const { data, error } = await db.rpc("consume_g_lab_auth_rate_limit", {
        p_scope: scope,
        p_subject_hash: subjectHash,
      });
      if (error) return useLocalFallback();
      const result = Array.isArray(data)
        ? (data[0] as LimitResult | undefined)
        : (data as LimitResult | null);
      if (!result || typeof result.allowed !== "boolean")
        return useLocalFallback();
      if (!result.allowed)
        retryAfterSeconds = Math.max(
          retryAfterSeconds,
          Number.isFinite(result.retry_after_seconds)
            ? result.retry_after_seconds
            : 60,
        );
    }
  } catch {
    return useLocalFallback();
  }

  return {
    available: true,
    allowed: retryAfterSeconds === 0,
    retryAfterSeconds,
  };
}
