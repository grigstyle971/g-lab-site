import { getLocale } from "../../lib/i18n/server";
import { translate } from "../../lib/i18n/translate";
import type { Metadata } from "next";
import PageContent from "./PageContent";
import { glFonts } from "../gl-fonts";
import { hasCourseAccess } from "../../lib/account/server";
import { CourseAccessGate } from "../../components/CourseAccessGate";
const englishMetadata: Metadata = {
    title: "Course workspace",
    description: "Your sixteen-lesson workspace for building and launching a real product.",
    robots: { index: false, follow: false },
};
export default async function Page(){
 const locale=await getLocale();
 if(!(await hasCourseAccess()))return <CourseAccessGate locale={locale} title={locale==="ru"?"Ваш курс":"Your course"}/>;
 return <PageContent fontClass={glFonts}/>;
}
export async function generateMetadata():Promise<Metadata>{const locale=await getLocale();return {...englishMetadata,title:translate(String(englishMetadata.title),locale),description:translate(englishMetadata.description||"",locale)};}
