import "./account.css";
import { Suspense } from "react";
import { translate } from "../lib/i18n/translate";
import type { Locale } from "../lib/i18n/translate";
import { LanguageProvider } from "../components/LanguageProvider";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { MarketingAnalytics } from "../components/MarketingAnalytics";
import "./language.css";
import type { Metadata } from "next";
import StudioMotion from "../components/StudioMotion";
import "./globals.css";
import "./cosmic-theme.css";
import "./studio-home.css";
import "./readability.css";
import "./project-inquiry.css";
import "./cinematic-motion.css";
import "./home-motion-scenes.css";
import "./work-page.css";
import "./about-page.css";
import "./expert-websites.css";
import "./dashboard.css";
import "./gl.css";
import "./gl-pages.css";
import { appOrigin } from "../lib/account/config";
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from "next/font/google";

const uiFont = IBM_Plex_Sans({ variable: "--font-ui", weight: "variable", subsets: ["latin", "cyrillic"], display: "swap" });
const displayFont = Space_Grotesk({ variable: "--font-space", weight: "variable", subsets: ["latin"], display: "swap" });
const monoFont = IBM_Plex_Mono({ variable: "--font-mono", weight: "400", subsets: ["latin", "cyrillic"], display: "swap" });

const englishMetadata: Metadata = {
  metadataBase: new URL(appOrigin()),
  title: {
    default: "Websites & Practical Courses — G-lab",
    template: "%s — G-lab",
  },
  description:
    "Custom websites for your business and practical courses to build your own with Codex, GitHub, Vercel and Supabase.",
  keywords: ["Codex course", "GitHub", "Vercel", "Supabase", "Next.js"],
  openGraph: {
    title: "Websites & Practical Courses",
    description:
      "Have your website built or learn to build it yourself.",
    type: "website",
    images: ["/g-lab-social.jpg"],
  },
};

export default async function RootLayout({
  children, locale,
}: Readonly<{ children: React.ReactNode; locale: Locale }>) {
  return (
    <html lang={locale} className={`${uiFont.variable} ${displayFont.variable} ${monoFont.variable}`}>
      <body>
        <LanguageProvider locale={locale}><Suspense fallback={null}><LanguageSwitcher/></Suspense><StudioMotion />
        {children}</LanguageProvider>
        <MarketingAnalytics />
      </body>
    </html>
  );
}

export function getSiteMetadata(locale:Locale):Metadata{return {...englishMetadata,title:{default:locale==="ru"?"Создание сайтов и практические курсы — G-lab":"Websites & Practical Courses — G-lab",template:"%s — G-lab"},description:locale==="ru"?"Закажите сайт для бизнеса или научитесь создавать сайты с Codex, GitHub, Vercel и Supabase.":englishMetadata.description,openGraph:{...englishMetadata.openGraph,title:locale==="ru"?"Создание сайтов и практические курсы":"Websites & Practical Courses",description:locale==="ru"?"Создание сайтов под заказ и обучение с нуля.":"Have your website built or learn to build it yourself.",locale:locale==="ru"?"ru_RU":"en_US"}};}
