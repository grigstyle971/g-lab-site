"use client";
import { Localize, useLocale } from "../../components/LanguageProvider";
import Link from "next/link";
import { CourseProgress } from "../../components/CourseProgress";
import { lessons, modules } from "../../lib/course";
import { RealSiteExamples } from "../../components/RealSiteExamples";
import { ArrowIcon } from "../../components/ArrowIcon";
import "../first-lesson.css";
import "../lesson-gl.css";

export default function LearnPage({ fontClass = "" }: { fontClass?: string }) {
    const ru = useLocale() === "ru";
    return <Localize>{(<main className={`academy-page gl ${fontClass}`}>
      <nav className="academy-nav">
        <Link href="/" className="brand">
          G<span>-</span>lab
        </Link>
        <span>BUILD &amp; LAUNCH WITH CODEX</span>
        <Link href="/courses/build-with-codex">Course overview <ArrowIcon /></Link>
      </nav>
      <header className="academy-hero">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>
            Make it
            <br />
            <em>real.</em>
          </h1>
          <p>
            {ru ? "16 коротких практических уроков. Создайте, сохраните и опубликуйте один сайт с помощью Codex, GitHub, Vercel и Supabase." : "16 short, practical lessons. Build, save and publish one website with Codex, GitHub, Vercel and Supabase."}
          </p>
          <Link className="academy-example-link" href={ru ? "/ru/course-example" : "/course-example"}>
            {ru ? "Открыть разобранный пример сайта" : "Open the worked website example"} <ArrowIcon />
          </Link>
        </div>
        <CourseProgress total={lessons.length} lessonSlugs={lessons.map(lesson => lesson.slug)} isDashboard/>
      </header>
      <section className="academy-roadmap">
        <div className="roadmap-head">
          <p className="eyebrow">THE COURSE</p>
          <p>
            {lessons.length} lessons · {modules.length} modules · one live
            product
          </p>
        </div>
        {modules.map((module) => (<article className="academy-module" key={module.number}>
            <div className="academy-module-title">
              <span>MODULE {module.number}</span>
              <h2>{module.title}</h2>
              <p>{module.lessons.length} guided written lessons</p>
            </div>
            <div className="academy-lessons">
              {module.lessons.map((lesson) => (<Link href={`/learn/${lesson.slug}`} className="academy-lesson" key={lesson.slug}>
                  <span>{lesson.number}</span>
                  <div>
                    <h3>{lesson.title}</h3>
                    <p>{lesson.summary}</p>
                  </div>
                  <time>{lesson.duration}</time>
                  <b><ArrowIcon /></b>
                </Link>))}
            </div>
          </article>))}
      </section>
      <RealSiteExamples />
      <footer className="academy-footer">
        <Link href="/" className="brand">
          G<span>-</span>lab
        </Link>
        <p>Built one focused step at a time.</p>
        <a href="mailto:glab.tech.support@gmail.com">Need help? glab.tech.support@gmail.com</a>
        <Link href={ru ? "/ru/privacy" : "/privacy"}>{ru ? "Данные" : "Privacy"}</Link>
        <Link href={ru ? "/ru/terms" : "/terms"}>{ru ? "Условия курса" : "Course terms"}</Link>
      </footer>
    </main>)}</Localize>;
}
