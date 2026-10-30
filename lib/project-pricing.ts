export type ProjectType = "website" | "landing" | "portal" | "automation" | "other";

type PriceBand = { minimum: number; maximum: number };

const startingPrices: Record<ProjectType, PriceBand> = {
  landing: { minimum: 250, maximum: 400 },
  website: { minimum: 300, maximum: 500 },
  portal: { minimum: 600, maximum: 950 },
  automation: { minimum: 250, maximum: 400 },
  other: { minimum: 250, maximum: 500 },
};

const featurePrices: Record<string, PriceBand> = {
  booking: { minimum: 75, maximum: 100 },
  payments: { minimum: 75, maximum: 175 },
  accounts: { minimum: 125, maximum: 225 },
  catalog: { minimum: 75, maximum: 125 },
  search: { minimum: 25, maximum: 75 },
  languages: { minimum: 75, maximum: 100 },
  cms: { minimum: 75, maximum: 125 },
  admin: { minimum: 100, maximum: 175 },
  integrations: { minimum: 25, maximum: 125 },
  other: { minimum: 75, maximum: 200 },
};

export type ProjectEstimate = PriceBand & { currency: "USD" };

/**
 * Accessible early-project estimate, not a fixed quote. The server calls the
 * same deterministic function before saving a request, so browser values are
 * never trusted as the stored estimate.
 */
export function estimateProjectPrice(input: {
  projectType: ProjectType;
  pages: string[];
  customPages: string;
  features: string[];
}): ProjectEstimate {
  const base = startingPrices[input.projectType];
  let minimum = base.minimum;
  let maximum = base.maximum;

  if (input.projectType !== "automation") {
    const selectedPages = input.pages.filter((page) => page !== "unsure" && page !== "other").length;
    const customPages = input.customPages.trim()
      ? input.customPages.split(/[;,\n]+/).filter((page) => page.trim()).length
      : 0;
    const totalPages = selectedPages + customPages;
    const includedPages = input.projectType === "landing" ? 1 : input.projectType === "portal" ? 5 : input.projectType === "website" ? 5 : 3;
    const extraPages = Math.max(0, totalPages - includedPages);
    const pageBand = { minimum: 25, maximum: 75 };
    minimum += extraPages * pageBand.minimum;
    maximum += extraPages * pageBand.maximum;
  }

  for (const feature of input.features) {
    // A client portal's base package already includes a basic signed-in area.
    if (input.projectType === "portal" && feature === "accounts") continue;
    const band = featurePrices[feature];
    if (band) {
      minimum += band.minimum;
      maximum += band.maximum;
    }
  }

  if (input.projectType === "landing") {
    minimum = Math.min(minimum, 1_000);
    maximum = Math.min(maximum, 1_000);
  }

  return { minimum, maximum, currency: "USD" };
}
