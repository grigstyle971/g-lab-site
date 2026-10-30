"use client";

import { track } from "@vercel/analytics";
import { captureCampaignAttribution } from "./campaign-attribution";

type MarketingEvent = "inquiry_started" | "inquiry_submitted" | "inquiry_failed" | "checkout_started" | "checkout_opened" | "checkout_failed";

// Only controlled labels; never include form contents or checkout identifiers.
export function marketingEvent(name: MarketingEvent, mode: "quick" | "brief" | "gumroad") {
  try {
    track(name, {
      mode,
      locale: document.documentElement.lang === "ru" ? "ru" : "en",
      ...captureCampaignAttribution(),
    });
  } catch {
    // Analytics must not interrupt a request or payment redirect.
  }
}
