"use client";

import type { ScreenGuide } from "../lib/lesson-material";

const guideVisuals: Record<string, { src: string; alt: string }> = {
  "Run a safe Codex build loop": { src: "/lesson-codex-workflow.png", alt: "A visual guide to the Codex build and review workflow" },
  "Create a safe project repository": { src: "/lesson-github-vercel.png", alt: "A visual guide to moving a project from GitHub to a deployment preview" },
  "Ship a safe Vercel preview": { src: "/lesson-github-vercel.png", alt: "A visual guide to creating a Vercel preview deployment" },
  "Add a protected customer space": { src: "/lesson-supabase-auth.png", alt: "A visual guide to enabling authentication and reaching a protected page" },
  "Test a real payment journey": { src: "/lesson-stripe-checkout.png", alt: "A visual guide to product price, checkout and confirmed access" },
  "Unlock access only after proof of payment": { src: "/lesson-stripe-checkout.png", alt: "A visual guide to webhook-confirmed customer access" },
};

export function TechnicalGuide({ guide }: { guide?: ScreenGuide }) {
  if (!guide) return null;
  const visual = guideVisuals[guide.title];

  return <section className="technical-guide">
    <header><p className="eyebrow">LIVE BUILD GUIDE</p><div><h2>{guide.title}</h2><span>{guide.tool}</span></div><p>{guide.goal}</p></header>
    {visual && <figure className="technical-guide-visual"><img src={visual.src} alt={visual.alt} loading="lazy" /><figcaption>Interface map — use the numbered steps below while you work.</figcaption></figure>}
    <ol>{guide.steps.map((step, index) => <li key={step.action}><span>{String(index + 1).padStart(2, "0")}</span><div><b>{step.screen}</b><p>{step.action}</p><small><strong>Check:</strong> {step.check}</small>{step.note && <em><strong>Watch out:</strong> {step.note}</em>}</div></li>)}</ol>
  </section>;
}