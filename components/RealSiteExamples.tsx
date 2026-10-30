import { Localize } from "./LanguageProvider";
import { siteExamples } from "../lib/site-examples";
import { ArrowIcon } from "./ArrowIcon";
export function RealSiteExamples({ compact = false }: {
    compact?: boolean;
}) {
    return <Localize>{<section className={`fl-real-work ${compact ? "is-compact" : ""}`} id="real-work">
    <p className="fl-kicker">REAL PROJECTS FROM OUR WORK</p><h2>Study the decisions. Apply the principle.</h2>
    <p>Use these live websites as references alongside the continuing photographer project. Inspect their public pages; no purchase or account access is needed for these exercises.</p>
    <div>{siteExamples.map(site => <article key={site.url}><small>{site.type}</small><h3><a href={site.url} target="_blank" rel="noreferrer">{site.name} <ArrowIcon /></a></h3><p>{site.observation}</p><p className="fl-note"><strong>Your task:</strong> {site.task}</p></article>)}</div>
    <p className="fl-note">These observations concern the public pages, not a verification of private account or payment behaviour. Learn from the structure and actions; use your own content and assets.</p>
  </section>}</Localize>;
}
