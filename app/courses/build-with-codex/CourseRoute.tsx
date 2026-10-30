import { getLocale } from "../../../lib/i18n/server";
import type { Locale } from "../../../lib/i18n/translate";
import type { Metadata } from "next";
import { paymentConfigured } from "../../../lib/account/config";
import PageContent from "./PageContent";
import { glFonts } from "../../gl-fonts";
const coursePath = "/courses/build-with-codex";
export function courseMetadata(locale: Locale): Metadata {
  const ru = locale === "ru";
  const title = ru
    ? "Создание сайта с Codex — практический курс из 16 уроков"
    : "Build a Website with Codex: 16 Practical Lessons";
  const description = ru
    ? "Научитесь создавать и публиковать сайт бизнеса с Codex, GitHub, Vercel и Supabase. Практический курс из 16 уроков для начинающих."
    : "Learn to build and publish a business website with Codex, GitHub, Vercel and Supabase. A practical 16-lesson course for beginners.";

  return {
    title,
    description,
    alternates: {
      canonical: ru ? `/ru${coursePath}` : coursePath,
      languages: {
        en: coursePath,
        ru: `/ru${coursePath}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: ru ? "ru_RU" : "en_US",
      images: [
        {
          url: "/g-lab-social.jpg",
          width: 1200,
          height: 630,
          type: "image/jpeg",
          alt: ru ? "Практический курс по созданию сайта с Codex" : "A practical course to build a website with Codex",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/g-lab-social.jpg"],
    },
  };
}
export default function Page(){return <PageContent checkoutAvailable={paymentConfigured("gumroad")} fontClass={glFonts}/>;}
export async function generateMetadata(): Promise<Metadata> {
  return courseMetadata(await getLocale());
}
