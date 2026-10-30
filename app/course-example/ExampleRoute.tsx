import type { Metadata } from "next";
import CourseExamplePage from "./PageContent";
import { hasCourseAccess } from "../../lib/account/server";
import { CourseAccessGate } from "../../components/CourseAccessGate";
import { getLocale } from "../../lib/i18n/server";

export const metadata: Metadata = {
  title: "A Worked Website Example",
  description:
    "Compare a weak draft with a complete fictional service website, then use a practical review checklist on your own project.",
  robots: { index: false, follow: false },
};

export default async function CourseExampleRoute() {
  const locale = await getLocale();
  if (!(await hasCourseAccess()))
    return (
      <CourseAccessGate
        locale={locale}
        title={locale === "ru" ? "Разбор готового сайта" : "A worked website example"}
      />
    );
  return <CourseExamplePage />;
}
