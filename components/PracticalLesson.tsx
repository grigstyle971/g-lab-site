"use client";
import { Localize } from "./LanguageProvider";
import { LanguageNote } from "./LanguageSwitcher";
import { BeginnerWalkthrough } from "./BeginnerWalkthrough";
import { LessonScreens, ScreenRefresher } from "./LessonScreens";
import Link from "next/link";
import type { Lesson } from "../lib/course";
import type { PracticalLessonData } from "../lib/lessons/types";
import { PromptCard } from "./PromptCard";
import { LessonNotebook } from "./LessonNotebook";
import { RealSiteExamples } from "./RealSiteExamples";
import { ArrowIcon } from "./ArrowIcon";
export function PracticalLesson({ lesson, overview, previous, next, siblings }: {
    lesson: PracticalLessonData;
    overview: Lesson;
    previous?: Lesson;
    next?: Lesson;
    siblings: Lesson[];
}) {
    return <Localize>{<main className="first-lesson" lang="en"><LanguageNote />
    <nav className="fl-nav"><Link href="/" className="brand">G<span>-</span>lab</Link><Link href="/learn">← Course roadmap</Link><span>LESSON {overview.number} / 16 · {overview.module}</span></nav>
    <header className="fl-header"><p className="fl-kicker">Learn it. Try it. Check it.</p><h1>{lesson.title}</h1><p>{lesson.summary}</p><div className="fl-meta"><span>{lesson.duration}</span><span>Step-by-step practice</span><span>Keep building your website</span></div><a href="#chapter-1" className="fl-primary">Start this lesson ↓</a></header>
    <div className="fl-body"><aside className="fl-toc"><p className="fl-kicker">THIS LESSON</p>{lesson.chapters.map((c, i) => <a href={`#chapter-${i + 1}`} key={c.title}>{String(i + 1).padStart(2, "0")} · {c.title}</a>)}<a href="#troubleshooting">If you get stuck</a><a href="#evidence">Practice and activities</a><p className="fl-kicker">{overview.module}</p>{siblings.map(s => <Link href={`/learn/${s.slug}`} key={s.slug} aria-current={s.slug === lesson.slug ? "page" : undefined}>{s.number} · {s.title}</Link>)}</aside>
    <article className="fl-content"><ScreenRefresher slug={lesson.slug}/><section className="fl-outcome"><p className="fl-kicker">GET READY</p><p>{lesson.prerequisite}</p><h2>What you will have by the end</h2><p>{lesson.outcome}</p></section><section className="fl-example"><p className="fl-kicker">THE WEBSITE WE ARE BUILDING</p><h2>Anna’s photography website</h2><p>{lesson.example}</p></section>
    {lesson.chapters.map((chapter, i) => <section className="fl-chapter" id={`chapter-${i + 1}`} key={chapter.title}><p className="fl-kicker">STEP {String(i + 1).padStart(2, "0")} / {chapter.screen}</p><h2>{chapter.title}</h2><p>{chapter.explanation}</p><div className="fl-do"><strong>Your turn</strong><ol>{chapter.actions.map(action => <li key={action}>{action}</li>)}</ol></div><p className="fl-note"><strong>How to tell it worked:</strong> {chapter.expected}</p><BeginnerWalkthrough slug={lesson.slug} chapter={i + 1}/><LessonScreens slug={lesson.slug} chapter={i + 1}/>{chapter.prompt && <PromptCard text={chapter.prompt}/>}</section>)}
    {["codex-workflow", "project-context", "responsive-hero", "client-space"].includes(lesson.slug) && <RealSiteExamples compact/>}
    <section className="fl-troubleshooting" id="troubleshooting"><h2>If you get stuck</h2>{lesson.troubleshooting.map(t => <details key={t.issue}><summary>{t.issue}</summary><p>{t.fix}</p></details>)}</section><section className="fl-sources"><p className="fl-kicker">NEED MORE DETAIL?</p><p className="fl-note">Interface labels and account options can change. Use the current official guide when your screen differs; keep the same intended outcome.</p>{lesson.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} <ArrowIcon /></a>)}</section></article></div>
    <LessonNotebook key={lesson.slug} lesson={lesson} nextSlug={next?.slug}/>
    <nav className="fl-next" aria-label="Lesson navigation">{previous ? <Link href={`/learn/${previous.slug}`}><small>← PREVIOUS / {previous.number}</small><strong>{previous.title}</strong></Link> : <Link href="/learn">Course roadmap</Link>}{next ? <Link href={`/learn/${next.slug}`}><small>NEXT / {next.number} →</small><strong>{next.title}</strong></Link> : <Link href="/learn"><small>COURSE COMPLETE</small><strong>Return to your roadmap →</strong></Link>}</nav>
  </main>}</Localize>;
}
