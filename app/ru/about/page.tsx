import type { Metadata } from "next";
import AboutPage from "../../AboutPage";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "О G-lab",
  description: "G-lab создаёт сайты для бизнеса и предлагает практический курс из 16 уроков. Контакт владельца Roman Grigorev: grigstyle971@gmail.com.",
  alternates: { canonical: "/ru/about", languages: { en: "/about", ru: "/ru/about" } },
};

export default function Page() { return <AboutPage locale="ru" />; }
