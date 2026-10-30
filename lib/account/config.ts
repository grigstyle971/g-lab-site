// Public project credentials supplied by the owner. Secret keys remain server-only.
const defaultSupabaseUrl = "https://bumhepivlebbpvlaxqwh.supabase.co";
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || defaultSupabaseUrl;
export const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || (supabaseUrl === defaultSupabaseUrl ? "sb_publishable_mFMsHSxh5LH1EZInCrMFFQ_jf_8CanF" : "");
export const COURSE_ID = "build-with-codex";
export const GUMROAD_COURSE_PERMALINK = "bdxgg";
export const PASSWORD_RECOVERY_LOCALE_COOKIE = "g-lab-password-recovery-locale";
export const PRICES = {
  gumroad: { amount: 1900, currency: "usd", label: "$19 USD" },
  stripe: { amount: 1900, currency: "usd", label: "$19 USD" },
  prodamus: { amount: 390000, currency: "rub", label: "3 900 ₽" },
} as const;
export type PaymentProvider = keyof typeof PRICES;
export function authConfigured() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}
function isProductionDeployment() {
  return (
    process.env.VERCEL_ENV === "production" ||
    (!process.env.VERCEL_ENV && process.env.NODE_ENV === "production")
  );
}
export function stripeProductionModeReady() {
  return !isProductionDeployment() || process.env.STRIPE_LIVE_MODE === "true";
}
export function livePaymentsEnabled() {
  return !isProductionDeployment() || process.env.PAYMENTS_LIVE_ENABLED === "true";
}
export function gumroadProductUrl() {
  const raw = process.env.GUMROAD_PRODUCT_URL;
  if (!raw) throw new Error("GUMROAD_PRODUCT_URL is not configured");
  const url = new URL(raw);
  const hostname = url.hostname.toLowerCase();
  if (
    url.protocol !== "https:" ||
    !(hostname === "gumroad.com" || hostname.endsWith(".gumroad.com")) ||
    !/^\/l\/[a-z0-9_-]+\/?$/i.test(url.pathname) ||
    url.username ||
    url.password
  )
    throw new Error("Invalid Gumroad product URL");
  url.hash = "";
  return url;
}
function gumroadProductUrlConfigured() {
  try {
    gumroadProductUrl();
    return true;
  } catch {
    return false;
  }
}
export function gumroadWebhookConfigured() {
  return Boolean(
    authConfigured() &&
      process.env.SUPABASE_SECRET_KEY &&
      process.env.CRON_SECRET &&
      process.env.CRON_SECRET.length >= 32 &&
      /^[A-Za-z0-9_-]+$/.test(process.env.CRON_SECRET) &&
      process.env.GUMROAD_ENABLED === "true" &&
      process.env.GUMROAD_ACCESS_TOKEN &&
      process.env.GUMROAD_PING_SECRET &&
      process.env.GUMROAD_PING_SECRET.length >= 32 &&
      /^[A-Za-z0-9_-]+$/.test(process.env.GUMROAD_PING_SECRET) &&
      gumroadProductUrlConfigured(),
  );
}
export function appOrigin() {
  const localDevelopment =
    process.env.NODE_ENV === "development" && !process.env.VERCEL;
  const value =
    process.env.APP_URL ||
    (localDevelopment
      ? "http://localhost:3000"
      : "https://g-lab.agency");
  if (!value) throw new Error("APP_URL is not configured");
  const url = new URL(value);
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new Error("Invalid APP_URL");
  return url.origin;
}
export function safeNext(value: unknown, locale: string = "en") {
  const fallback = locale === "ru" ? "/ru/account" : "/account";
  if (
    typeof value !== "string" ||
    !/^\/(?:ru\/)?(?:account|course-checkout|learn(?:\/[a-z0-9-]+)?)(?:\?[^\\\r\n]*)?$/.test(
      value,
    )
  )
    return fallback;
  return value;
}
export function paymentConfigured(provider: PaymentProvider) {
  const base =
    authConfigured() &&
    livePaymentsEnabled() &&
    Boolean(process.env.SUPABASE_SECRET_KEY && process.env.APP_URL);
  if (!base) return false;
  if (provider === "gumroad")
    return Boolean(
      process.env.GUMROAD_ENABLED === "true" &&
        process.env.CRON_SECRET &&
        process.env.CRON_SECRET.length >= 32 &&
        /^[A-Za-z0-9_-]+$/.test(process.env.CRON_SECRET) &&
        process.env.GUMROAD_ACCESS_TOKEN &&
        process.env.GUMROAD_PING_SECRET &&
        process.env.GUMROAD_PING_SECRET.length >= 32 &&
        /^[A-Za-z0-9_-]+$/.test(process.env.GUMROAD_PING_SECRET) &&
        gumroadProductUrlConfigured(),
    );
  if (provider === "stripe")
    return Boolean(
      process.env.STRIPE_SECRET_KEY &&
        process.env.STRIPE_WEBHOOK_SECRET &&
        stripeProductionModeReady(),
    );
  return Boolean(
    process.env.PRODAMUS_FORM_URL &&
      process.env.PRODAMUS_SECRET_KEY &&
      process.env.PRODAMUS_SYS,
  );
}
