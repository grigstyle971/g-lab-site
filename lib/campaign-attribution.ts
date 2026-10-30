const campaignParamNames = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

type CampaignParamName = (typeof campaignParamNames)[number];
export type CampaignAttributes = Partial<Record<CampaignParamName, string>>;

const campaignStorageKey = "g_lab_campaign_attribution_v1";
const safeCampaignValue = /^[a-z0-9_-]{1,64}$/i;

function sanitizeCampaignObject(value: unknown): CampaignAttributes {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const source = value as Record<string, unknown>;
  const result: CampaignAttributes = {};

  for (const name of campaignParamNames) {
    const candidate = source[name];
    if (typeof candidate === "string" && safeCampaignValue.test(candidate)) {
      result[name] = candidate;
    }
  }

  return result;
}

/** Keep only the campaign labels we deliberately support before sending them to an API. */
export function sanitizeCampaignAttributes(value: unknown): CampaignAttributes {
  return sanitizeCampaignObject(value);
}

export function sanitizeCampaignParams(params: URLSearchParams): CampaignAttributes {
  const result: CampaignAttributes = {};

  for (const name of campaignParamNames) {
    const value = params.get(name);
    if (value && safeCampaignValue.test(value)) result[name] = value;
  }

  return result;
}

function readStoredCampaignAttributes(): CampaignAttributes {
  try {
    const stored = window.sessionStorage.getItem(campaignStorageKey);
    return stored ? sanitizeCampaignObject(JSON.parse(stored)) : {};
  } catch {
    return {};
  }
}

/** Keep only controlled campaign labels for this tab's session. */
export function captureCampaignAttribution(): CampaignAttributes {
  if (typeof window === "undefined") return {};

  const current = sanitizeCampaignParams(new URLSearchParams(window.location.search));
  if (Object.keys(current).length === 0) return readStoredCampaignAttributes();

  try {
    window.sessionStorage.setItem(campaignStorageKey, JSON.stringify(current));
  } catch {
    // Tracking must still work when storage is unavailable.
  }

  return current;
}
