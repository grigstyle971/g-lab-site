"use client";
import { Localize } from "./LanguageProvider";

import { useRef, useState } from "react";
import { beginnerGuides, beginnerPlacements } from "../lib/beginner-guides";
import { lessonScreens } from "../lib/lesson-screens";
import { ScreenCard } from "./LessonScreens";
import { ArrowIcon } from "./ArrowIcon";
export function BeginnerWalkthrough({ slug, chapter }: {
    slug: string;
    chapter: number;
}) {
    const id = beginnerPlacements[slug]?.[chapter];
    return <Localize>{id ? <Guide key={id} id={id} nextChapter={chapter + 1}/> : null}</Localize>;
}
function Guide({ id, nextChapter }: {
    id: string;
    nextChapter: number;
}) {
    const guide = beginnerGuides[id];
    const [index, setIndex] = useState(0);
    const [all, setAll] = useState(false);
    const heading = useRef<HTMLHeadingElement>(null);
    const move = (next: number) => { setIndex(next); heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: "start", behavior: "smooth" }); };
    const step = guide.steps[index];
    return <Localize>{<section className="fl-beginner" data-guide={id} aria-label={`${guide.tool} beginner walkthrough`}>
  <p className="fl-kicker">FIRST-TIME SETUP / {guide.tool}</p><h3 ref={heading} tabIndex={-1}>{guide.title}</h3><p>{guide.intro}</p>
  <p className="fl-beginner-note">This is a guide, not a live {guide.tool} screen. The controls below navigate the lesson; perform the actions in your own app or account.</p>
  <div className="fl-guide-mode"><span>{guide.steps.length} small steps</span><button type="button" aria-pressed={all} onClick={() => setAll(!all)}>{all ? "Show one step at a time" : "Show all steps"}</button></div>
  {!all && <nav className="fl-guide-steps" aria-label={`${guide.tool} setup steps`}>{guide.steps.map((item, i) => <button type="button" key={item.title} aria-current={index === i ? "step" : undefined} onClick={() => move(i)}><span>{String(i + 1).padStart(2, "0")}</span>{item.title}</button>)}</nav>}
  {(all ? guide.steps : [step]).map((item, i) => {
            const n = all ? i : index;
            return <Localize key={item.title}>{<article className="fl-guide-step"><p className="fl-kicker">STEP {n + 1} OF {guide.steps.length}</p><h4>{item.title}</h4><p className="fl-guide-location"><strong>Where:</strong> {item.where}</p>
   {item.words && <dl className="fl-guide-words">{item.words.map(term => <div key={term.word}><dt>{term.word}</dt><dd>{term.meaning}</dd></div>)}</dl>}
   <ol className="fl-guide-actions">{item.actions.map(action => <li key={action}>{action}</li>)}</ol>
   {item.link && <a className="fl-guide-external" href={item.link.url} target="_blank" rel="noreferrer">{item.link.label} <ArrowIcon /></a>}
   {item.screen && <ScreenCard key={item.screen} screen={lessonScreens[item.screen]} compact/>}
   <div className="fl-guide-result"><strong>Pause and compare</strong><p>{item.expected}</p></div><details className="fl-guide-help"><summary>My screen or result is different</summary><p>{item.stuck}</p></details>
  </article>}</Localize>;
        })}
  {!all && <div className="fl-guide-navigation"><button type="button" disabled={index === 0} onClick={() => move(index - 1)}>← Previous step</button><span aria-live="polite">{index + 1} / {guide.steps.length}</span>{index < guide.steps.length - 1 ? <button type="button" onClick={() => move(index + 1)}>Next step →</button> : <a href={`#chapter-${nextChapter}`}>Continue the lesson ↓</a>}</div>}
 </section>}</Localize>;
}
