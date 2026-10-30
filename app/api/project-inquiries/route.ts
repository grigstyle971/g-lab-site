import { createHmac } from "node:crypto";
import { adminClient } from "../../../lib/account/server";
import { accountJson, sameOrigin } from "../../../lib/account/http";
import { estimateProjectPrice, type ProjectType } from "../../../lib/project-pricing";
import { sanitizeCampaignAttributes } from "../../../lib/campaign-attribution";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const oneOf = (value: unknown, values: string[]): value is string =>
  typeof value === "string" && values.includes(value);
const pageKeys = ["home", "about", "services", "product", "work", "pricing", "faq", "contact", "blog", "account", "other", "unsure"];
const featureKeys = ["form", "booking", "payments", "accounts", "catalog", "search", "languages", "cms", "admin", "analytics", "integrations", "other", "unsure"];

function parseProjectBrief(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const brief = value as Record<string, unknown>;
  const boundedText = (key: string, max: number, min = 0) =>
    typeof brief[key] === "string" && (brief[key] as string).trim().length >= min && (brief[key] as string).trim().length <= max;
  const validList = (key: string, allowed: string[], min: number, max: number) =>
    Array.isArray(brief[key]) && (brief[key] as unknown[]).length >= min && (brief[key] as unknown[]).length <= max &&
    (brief[key] as unknown[]).every((item) => typeof item === "string" && allowed.includes(item)) &&
    new Set(brief[key] as string[]).size === (brief[key] as string[]).length;
  if (
    !boundedText("audience", 700, 3) || !validList("pages", pageKeys, 1, 12) ||
    !boundedText("customPages", 500) || !validList("features", featureKeys, 1, 13) ||
    !boundedText("customFeatures", 500) || !oneOf(brief.visualStyle, ["minimal", "premium", "bold", "cinematic", "friendly", "reference", "unsure"]) ||
    !boundedText("references", 1000) || !oneOf(brief.assets, ["ready", "partial", "need-help", "unsure"]) ||
    !oneOf(brief.domain, ["have", "need", "unsure"]) || !boundedText("existingTools", 1200)
  ) return null;
  if ((brief.pages as string[]).includes("other") && !(brief.customPages as string).trim()) return null;
  if ((brief.features as string[]).includes("other") && !(brief.customFeatures as string).trim()) return null;
  if (brief.visualStyle === "reference" && !(brief.references as string).trim()) return null;
  return {
    audience: (brief.audience as string).trim(),
    pages: brief.pages,
    customPages: (brief.customPages as string).trim(),
    features: brief.features,
    customFeatures: (brief.customFeatures as string).trim(),
    visualStyle: brief.visualStyle,
    references: (brief.references as string).trim(),
    assets: brief.assets,
    domain: brief.domain,
    existingTools: (brief.existingTools as string).trim(),
  };
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return accountJson({ error: "origin" }, 403);
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 12_000) return accountJson({ error: "invalid" }, 413);
  const reader = request.body?.getReader();
  if (!reader) return accountJson({ error: "invalid" }, 400);
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > 12_000) {
        await reader.cancel();
        return accountJson({ error: "invalid" }, 413);
      }
      chunks.push(value);
    }
  } catch {
    return accountJson({ error: "invalid" }, 400);
  }
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return accountJson({ error: "invalid" }, 400);
    body = parsed as Record<string, unknown>;
  } catch {
    return accountJson({ error: "invalid" }, 400);
  }

  // Quietly accept honeypot submissions without storing or confirming them.
  if (typeof body.website === "string" && body.website.trim()) return accountJson({ ok: true });

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const quick = body.mode === "quick";
  if (quick && body.consent !== true) return accountJson({ error: "invalid" }, 400);
  const projectType = quick ? "other" : body.projectType;
  const summary = typeof body.summary === "string" ? body.summary.trim() : "";
  const projectBrief = quick ? {
    inquiryMode: "quick", audience: "Not specified", pages: ["unsure"], customPages: "",
    features: ["unsure"], customFeatures: "", visualStyle: "unsure", references: "",
    assets: "unsure", domain: "unsure", existingTools: "",
  } : parseProjectBrief(body.projectBrief);
  const timeline = quick ? "not-specified" : body.timeline;
  const budgetRange = quick ? "not-specified" : body.budgetRange;
  const locale = body.locale;
  if (
    (!quick && name.length < 1) || name.length > 120 || !emailPattern.test(email) || email.length > 254 ||
    !oneOf(projectType, ["website", "landing", "portal", "automation", "other"]) ||
    summary.length < 3 || summary.length > 3000 ||
    !projectBrief ||
    !oneOf(timeline, quick ? ["not-specified"] : ["soon", "month", "planning"]) ||
    !oneOf(budgetRange, quick ? ["not-specified"] : ["under-1000", "1000-3000", "3000-plus", "not-sure"]) ||
    !oneOf(locale, ["en", "ru"])
  ) return accountJson({ error: "invalid" }, 400);

  const estimate = estimateProjectPrice({
    projectType: projectType as ProjectType,
    pages: projectBrief.pages as string[],
    customPages: projectBrief.customPages as string,
    features: projectBrief.features as string[],
  });
  const attribution = sanitizeCampaignAttributes(body.attribution);
  const storedProjectBrief = Object.keys(attribution).length
    ? { ...projectBrief, attribution }
    : projectBrief;

  const ip = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) return accountJson({ error: "setup" }, 503);
  const requesterHash = createHmac("sha256", secret).update(ip).digest("hex");
  try {
    const { error } = await adminClient().rpc("submit_project_inquiry", {
      p_name: name || (locale === "ru" ? "Не указано" : "Not provided"),
      p_email: email,
      p_project_type: projectType,
      p_summary: summary,
      p_project_brief: storedProjectBrief,
      p_estimated_min_usd: estimate.minimum,
      p_estimated_max_usd: estimate.maximum,
      p_timeline: timeline,
      p_budget_range: budgetRange,
      p_locale: locale,
      p_requester_hash: requesterHash,
    });
    if (error) {
      if (error.code === "P0001") return accountJson({ error: "limit" }, 429);
      if (error.code === "22023") return accountJson({ error: "invalid" }, 400);
      return accountJson({ error: "setup" }, 503);
    }
    return accountJson({ ok: true });
  } catch {
    return accountJson({ error: "setup" }, 503);
  }
}
