import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { translate } from "../../../lib/i18n/translate";
import { findLesson, lessons } from "../../../lib/course";
import { findPracticalLesson } from "../../../lib/practical-course";
import { conciseGuide } from "../../../lib/concise-course";
import { conciseLessonHelp } from "../../../lib/concise-lesson-help";
import { lessonScreens } from "../../../lib/lesson-screens";
import { ConciseLesson } from "../../../components/ConciseLesson";
import { CourseAccessGate } from "../../../components/CourseAccessGate";
import { hasCourseAccess } from "../../../lib/account/server";
import { LessonTranslations } from "../../../components/LanguageProvider";
import { lessonTranslations } from "../../../lib/i18n/lesson-translations";
import "../../first-lesson.css";
import "../../concise-lessons.css";
import "../../lesson-gl.css";
import { glFonts } from "../../gl-fonts";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lesson: string }>;
}): Promise<Metadata> => {
  const lesson = findLesson((await params).lesson);
  if (!lesson) return {};
  return {
    title: `${lesson.number}. ${lesson.title}`,
    description: lesson.summary,
    robots: { index: false, follow: false },
  };
};

export default async function LessonPage({ params, locale = "en" }: {
  params: Promise<{ lesson: string }>;
  locale?: "en" | "ru";
}) {
  const slug = (await params).lesson;
  const overview = findLesson(slug);
  if (!overview) notFound();
  if (!(await hasCourseAccess())) {
    return <CourseAccessGate locale={locale} title={translate(overview.title, locale)} />;
  }

  // Resolve paid lesson content only after the existing access check.
  const original = findPracticalLesson(slug);
  if (slug !== "welcome" && !original) notFound();
  const index = lessons.findIndex(lesson => lesson.slug === slug);
  const guide = conciseGuide(slug, locale, original);
  const sources = original?.sources ?? [
    { title: locale === "ru" ? "OpenAI: как начать работу с Codex" : "OpenAI: getting started with Codex", url: "https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan" },
    { title: locale === "ru" ? "OpenAI: встроенный браузер" : "OpenAI: the built-in browser", url: "https://help.openai.com/en/articles/20001277-using-the-built-in-browser-in-the-chatgpt-desktop-app" },
  ];
  const screenContent = guide.steps.flatMap(step => (step.screens ?? []).map(id => lessonScreens[id]));
  return <LessonTranslations translations={locale === "ru" ? lessonTranslations([sources, screenContent]) : {}}>
    <ConciseLesson
      slug={slug}
      number={overview.number}
      guide={guide}
      previousSlug={lessons[index - 1]?.slug}
      nextSlug={lessons[index + 1]?.slug}
      sources={sources}
      troubleshooting={conciseLessonHelp(slug, locale)}
      fontClass={glFonts}
    />
  </LessonTranslations>;
}
