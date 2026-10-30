"use client";

import { useEffect } from "react";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { captureCampaignAttribution, sanitizeCampaignParams } from "../lib/campaign-attribution";

const trackedPages = new Set([
  "/",
  "/ru",
  "/courses/build-with-codex",
  "/ru/courses/build-with-codex",
  "/websites-for-experts",
  "/ru/websites-for-experts",
  "/websites-for-businesses",
  "/ru/websites-for-businesses",
  "/work",
  "/ru/work",
  "/about",
  "/ru/about",
]);

function filterAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  const url = new URL(event.url, window.location.origin);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  // Keep traffic reporting on public marketing pages; never send account, lesson,
  // checkout, or authentication URLs to analytics.
  if (!trackedPages.has(path)) return null;

  // Keep only controlled campaign labels. Strip auth codes, emails, order IDs,
  // arbitrary query strings, and fragments before an event leaves the browser.
  const safeParams = new URLSearchParams();
  for (const [key, value] of Object.entries(sanitizeCampaignParams(url.searchParams))) {
    safeParams.set(key, value);
  }
  url.search = safeParams.toString();
  url.hash = "";

  return { ...event, url: url.toString() };
}

export function MarketingAnalytics() {
  useEffect(() => {
    captureCampaignAttribution();
  }, []);

  return <Analytics beforeSend={filterAnalyticsEvent} />;
}
