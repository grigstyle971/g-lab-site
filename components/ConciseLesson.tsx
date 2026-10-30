"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Localize, useLocale } from "./LanguageProvider";
import { ScreenCard } from "./LessonScreens";
import { LessonCompletion } from "./LessonCompletion";
import { lessonScreens } from "../lib/lesson-screens";
import type { ConciseGuide } from "../lib/concise-lesson-types";
import { lessons, modules } from "../lib/course";
import { translate } from "../lib/i18n/translate";

const moduleTools = ["Codex", "GitHub", "Vercel", "Supabase"];

// Sixteen cells in four modules: where this lesson sits on the road from idea to launch.
function CourseMap({ slug, ru }: { slug: string; ru: boolean }) {
  return <nav className="fl-map" aria-label={ru ? "Карта курса" : "Course map"}>
    {modules.map((module, i) => <div key={module.number}>
      <span>{module.number} · {moduleTools[i]}</span>
      <ol>{module.lessons.map(lesson => <li key={lesson.slug}>
        <Link href={`/learn/${lesson.slug}`} aria-current={lesson.slug === slug ? "page" : undefined} title={translate(lesson.title, ru ? "ru" : "en")}>{lesson.number}</Link>
      </li>)}</ol>
    </div>)}
  </nav>;
}

function ReadyRequest({ text, ru }: { text: string; ru: boolean }) {
  const details = useRef<HTMLDetailsElement>(null);
  const [status, setStatus] = useState("");
  return <div className="fl-prompt fl-compact-prompt">
    <div><strong>{ru ? "Готовый запрос для Codex" : "Ready to send to Codex"}</strong>
      <button type="button" onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setStatus(ru ? "Скопировано. Вставьте в свой проект Codex." : "Copied. Paste into your Codex project.");
        } catch {
          if (details.current) details.current.open = true;
          setStatus(ru ? "Выделите и скопируйте текст вручную." : "Select and copy the text manually.");
        }
      }}>{ru ? "Скопировать" : "Copy request"}</button>
    </div>
    {/\[[^\]]+\]/.test(text) && <p className="fl-compact-placeholder">{ru ? "Замените данные в [скобках] перед отправкой." : "Replace the details in [brackets] before sending."}</p>}
    <details ref={details}><summary>{ru ? "Прочитать запрос" : "Read the request"}</summary><pre tabIndex={0}>{text}</pre></details>
    <p role="status">{status}</p>
  </div>;
}

export function ConciseLesson({ slug, number, guide, previousSlug, nextSlug, sources, troubleshooting = [], fontClass = "" }: {
  fontClass?: string;
  slug: string;
  number: string;
  guide: ConciseGuide;
  previousSlug?: string;
  nextSlug?: string;
  sources: { title: string; url: string }[];
  troubleshooting?: { issue: string; fix: string }[];
}) {
  const locale = useLocale();
  const ru = locale === "ru";
  const duration = lessons.find(lesson => lesson.slug === slug)?.duration;
  return <Localize><main className={`first-lesson fl-concise gl ${fontClass}`} lang={locale}>
    <nav className="fl-nav"><Link href="/" className="brand">G<span>-</span>lab</Link><Link href="/learn">{ru ? "← Все уроки" : "← All lessons"}</Link></nav>
    <header className="fl-header">
      <p className="fl-kicker">{ru ? `УРОК ${number} / 16 · ${guide.steps.length} ШАГА` : `LESSON ${number} / 16 · ${guide.steps.length} STEPS`}{duration && ` · ${translate(duration, locale)}`}</p>
      <h1>{guide.title}</h1><p>{guide.summary}</p>
      <dl className="fl-why">
        <div><dt>{ru ? "Зачем это вашему бизнесу" : "Why it matters for your business"}</dt><dd>{guide.why}</dd></div>
        <div><dt>{ru ? "В конце урока" : "By the end"}</dt><dd>{guide.steps.at(-1)?.expected}</dd></div>
      </dl>
      <a href="#step-1" className="fl-primary">{ru ? "Начать" : "Start lesson"}</a>
      <CourseMap slug={slug} ru={ru} />
    </header>
    <div className="fl-concise-body">
      {guide.steps.map((step, index) => <section className="fl-compact-step" id={`step-${index + 1}`} key={step.title}>
        {step.chapters.map(chapter => <span className="fl-chapter-anchor" id={`chapter-${chapter}`} key={chapter} />)}
        {slug === "welcome" && index === 1 && <span className="fl-chapter-anchor" id="brief" />}
        <p className="fl-kicker">{ru ? "ШАГ" : "STEP"} {String(index + 1).padStart(2, "0")}</p>
        <h2>{step.title}</h2>
        <ol className="fl-compact-actions">{step.actions.map(action => <li key={action}>{action}</li>)}</ol>
        {step.prompt && <ReadyRequest text={step.prompt} ru={ru} />}
        <p className="fl-compact-result"><strong>{ru ? "Результат: " : "Expected result: "}</strong>{step.expected}</p>
        {!!step.screens?.length && <details className="fl-compact-help"><summary>{ru ? "Показать, где нажать" : "Show me where to click"}</summary>
          <div>{step.screens.map(id => <ScreenCard key={id} screen={lessonScreens[id]} compact />)}</div>
        </details>}
      </section>)}
      <section className="fl-compact-resources" id="troubleshooting">
        {!!troubleshooting.length && <details className="fl-compact-help"><summary>{ru ? "Если что-то не получается" : "If you get stuck"}</summary>
          <div className="fl-compact-troubleshooting">{troubleshooting.map(item => <details key={item.issue}><summary>{item.issue}</summary><p>{item.fix}</p></details>)}</div>
        </details>}
        <details className="fl-compact-help"><summary>{ru ? "Официальные инструкции" : "Official guides"}</summary>
          <ul>{sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul>
        </details>
      </section>
      <LessonCompletion key={slug} slug={slug} checks={guide.checks} checkKeys={guide.checkKeys} nextSlug={nextSlug} />
      <nav className="fl-concise-footer" aria-label={ru ? "Переходы по курсу" : "Course navigation"}>
        {previousSlug && <Link href={`/learn/${previousSlug}`}>{ru ? "← Предыдущий урок" : "← Previous lesson"}</Link>}
        <Link href="/learn">{ru ? "Все уроки" : "All lessons"}</Link>
      </nav>
    </div>
  </main></Localize>;
}
